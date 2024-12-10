function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delay
 * @param ms Milliseconds
 */
export async function delay(ms: number) {
  await sleep(ms);
}

/**
 * Delay Randomly
 * @param param0 
 */
export async function randomDelay({startRangeMS = 0, endRangeMS = 10000}) {
  const randomNumber = getRandomInt(startRangeMS, endRangeMS);
  await sleep(randomNumber);
}

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#examples
 * @param min 
 * @param max 
 * @returns 
 */
function getRandomInt(min:number, max:number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}