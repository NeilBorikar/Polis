import logging
import sys
from app.config import settings

def setup_logging() -> None:
    """
    Set up logging configuration for the application.
    For production, this can be extended to use structured JSON logging.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Use standard logging config
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Suppress verbose logs from third-party libraries unless necessary
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info("Logging configured. Level: %s", logging.getLevelName(log_level))
