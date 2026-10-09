import { createChatHandler } from '../server/chat'

// Created once per instance so the rate limiter and the SDK client persist between requests.
const handler = createChatHandler(process.env)

export const POST = (request: Request) => handler(request)

// Any other method gets the handler's 405 with an Allow header.
export const GET = POST
export const PUT = POST
export const PATCH = POST
export const DELETE = POST
