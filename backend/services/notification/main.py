import asyncio
import logging
from fastapi import FastAPI
from app.core.config import settings
from app.services.event_handlers import handle_user_created, handle_ticket_issued, handle_payment_failed
from backend.shared.kafka_utils import KafkaManager

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "notification-service"}

@app.on_event("startup")
async def startup_event():
    # Start the worker in the background
    asyncio.create_task(start_notification_worker())

async def start_notification_worker():
    """
    Starts the main worker to consume events and send notifications.
    As this service grows, we might split workers into separate processes 
    or use a more robust distributed task queue like Celery.
    """
    kafka_manager = KafkaManager(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        client_id="notification-service-consumer"
    )
    
    # 1. Start consuming User Created events
    user_created_task = asyncio.create_task(kafka_manager.consume(
        topic="user.created",
        group_id="notification-service-group",
        callback=handle_user_created
    ))
    
    # 2. Start consuming Ticket Issued events
    ticket_issued_task = asyncio.create_task(kafka_manager.consume(
        topic="ticket.issued",
        group_id="notification-service-group",
        callback=handle_ticket_issued
    ))

    # 3. Start consuming Payment Failure events
    payment_failed_task = asyncio.create_task(kafka_manager.consume(
        topic="payment.failed",
        group_id="notification-service-group",
        callback=handle_payment_failed
    ))

    logger.info("Notification worker started and listening to topics...")
    
    # Keep the worker running
    await asyncio.gather(user_created_task, ticket_issued_task, payment_failed_task)

if __name__ == "__main__":
    try:
        asyncio.run(start_notification_worker())
    except KeyboardInterrupt:
        logger.info("Notification Service stopped.")
