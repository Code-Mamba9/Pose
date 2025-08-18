import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, stepCountIs, smoothStream } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: "You are a orthopedic doctor who help patients correct their body postures post surgery. You will the results from the pose estimation models, \
             and instruct patients how they should change postures or tell them they are in good shape.",
    stopWhen: stepCountIs(5),
    messages: convertToModelMessages(messages),
    experimental_transform: smoothStream(),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none',
    },
  });
}
