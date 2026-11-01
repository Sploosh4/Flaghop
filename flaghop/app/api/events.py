"""Bridge thread-originated invalidations into bounded asynchronous WebSocket queues."""

import asyncio
from contextlib import suppress
from fastapi import WebSocket, WebSocketDisconnect


def register_event_routes(app):
    @app.websocket("/ws/snapshot")
    async def snapshot_feed(websocket: WebSocket):
        await websocket.accept()
        stream = websocket.app.state.runtime.events
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue(maxsize=1)
        cursor = 0

        def enqueue(payload):
            if queue.full():
                pending = queue.get_nowait()
                payload = {
                    "type": "invalidate",
                    "seq": max(payload["seq"], pending["seq"]),
                    "channels": sorted(set(payload["channels"]) | set(pending["channels"])),
                }
            queue.put_nowait(payload)

        def notify(payload):
            try:
                loop.call_soon_threadsafe(enqueue, payload)
            except RuntimeError:
                # An emit already in flight may race with a closing event loop.
                return

        unsubscribe, pending = stream.subscribe(notify)
        for payload in pending:
            enqueue(payload)

        async def receive_until_disconnect():
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    return

        receiver = asyncio.create_task(receive_until_disconnect())
        heartbeat = max(0.01, float(websocket.app.state.config.get("LEGION_WS_EVENT_HEARTBEAT_SECONDS", 30)))
        try:
            while not receiver.done():
                next_event = asyncio.create_task(queue.get())
                done, _ = await asyncio.wait(
                    {next_event, receiver}, timeout=heartbeat, return_when=asyncio.FIRST_COMPLETED
                )
                if receiver in done:
                    next_event.cancel()
                    with suppress(asyncio.CancelledError):
                        await next_event
                    break
                if next_event not in done:
                    next_event.cancel()
                    with suppress(asyncio.CancelledError):
                        await next_event
                    await websocket.send_json({"type": "heartbeat", "seq": cursor, "channels": []})
                    continue
                # Notification callbacks run on worker threads and can arrive out of order.
                # Read all journal entries after the cursor so no invalidation channel is lost.
                payload = stream.pending_after(cursor)
                if payload is None:
                    continue
                cursor = payload["seq"]
                await websocket.send_json(payload)
        except (WebSocketDisconnect, RuntimeError):
            pass
        finally:
            unsubscribe()
            receiver.cancel()
            with suppress(asyncio.CancelledError, WebSocketDisconnect):
                await receiver
