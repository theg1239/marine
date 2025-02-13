import asyncio
import json
from urllib.parse import urljoin, urlparse, parse_qs
from aiohttp import ClientSession, ClientTimeout
from bs4 import BeautifulSoup
from app.kafka_client import get_kafka_producer
from app.config import settings
from loguru import logger

VIDEO_EXTENSIONS = (".mp4", ".webm", ".mkv", ".avi")

async def is_valid_video_url(url: str) -> bool:
    parsed = urlparse(url)
    netloc = parsed.netloc.lower()
    path = parsed.path.lower()
    query = parse_qs(parsed.query)


    if "youtube.com" in netloc:
        if "/watch" in path and "v" in query and query["v"]:
            return True
        if path.startswith("/embed/"):
            return True
        return False
    if "youtu.be" in netloc:
        return True
    if "vimeo.com" in netloc:
        parts = path.lstrip("/").split("/")
        if parts and parts[0].isdigit():
            return True
        return False
    for ext in VIDEO_EXTENSIONS:
        if url.lower().endswith(ext):
            return True
    return False

def parse_video_links(html: str, base_url: str = None) -> list:
    soup = BeautifulSoup(html, "lxml")
    links = set()
    for video in soup.find_all("video"):
        src = video.get("src")
        if src:
            links.add(urljoin(base_url, src) if base_url else src)
        for source in video.find_all("source"):
            src = source.get("src")
            if src:
                links.add(urljoin(base_url, src) if base_url else src)
    for iframe in soup.find_all("iframe"):
        src = iframe.get("src")
        if src:
            links.add(urljoin(base_url, src) if base_url else src)
    for embed in soup.find_all("embed"):
        src = embed.get("src")
        if src:
            links.add(urljoin(base_url, src) if base_url else src)
    known_video_providers = ["youtube.com", "youtu.be", "vimeo.com"]
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_href = urljoin(base_url, href) if base_url else href
        if any(full_href.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
            links.add(full_href)
        else:
            for provider in known_video_providers:
                if provider in full_href.lower():
                    links.add(full_href)
                    break
    return list(links)

async def filter_valid_links(links: list) -> list:
    valid_links = []
    for link in links:
        if await is_valid_video_url(link):
            valid_links.append(link)
    return valid_links

async def fetch_page(url: str, session: ClientSession) -> str:
    headers = {"User-Agent": settings.user_agent}
    try:
        async with session.get(url, headers=headers, timeout=ClientTimeout(total=30)) as response:
            response.raise_for_status()
            html = await response.text()
            logger.info(f"Fetched page: {url}")
            return html
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return ""

async def process_url(url: str, session: ClientSession):
    parsed_url = urlparse(url)
    netloc = parsed_url.netloc.lower()


    video_links = []
    if await is_valid_video_url(url):
        video_links.append(url)
        logger.info(f"Submitted URL is a valid video URL: {url}")
    else:
        html = await fetch_page(url, session)
        if not html:
            return
        raw_links = parse_video_links(html, base_url=url)
        video_links = await filter_valid_links(raw_links)

    if not video_links:
        logger.info(f"No valid video links found on {url}")
        return

    producer = await get_kafka_producer()
    for video_url in video_links:
        message = {
            "source_page": url,
            "video_url": video_url,
            "analysis_type": "crawled"
        }
        await producer.send_and_wait(
            topic=settings.kafka_video_download_topic,
            value=json.dumps(message).encode("utf-8")
        )
        logger.info(f"Produced video download task for {video_url}")

async def crawl_worker(url_queue: asyncio.Queue):
    async with ClientSession() as session:
        while True:
            url = await url_queue.get()
            try:
                await process_url(url, session)
            except Exception as e:
                logger.error(f"Error processing URL {url}: {e}")
            finally:
                url_queue.task_done()

async def run_crawlers(urls: list):
    url_queue = asyncio.Queue()
    for url in urls:
        url_queue.put_nowait(url)
    tasks = []
    num_workers = min(settings.max_concurrent_crawlers, len(urls))
    for _ in range(num_workers):
        tasks.append(asyncio.create_task(crawl_worker(url_queue)))
    await url_queue.join()
    for task in tasks:
        task.cancel()
