import type { GreetRequest } from "./types";

export async function greet(aGreetRequest: GreetRequest): Promise<string> {
  const { name } = aGreetRequest;
  return `Hello ${name}!`;
}