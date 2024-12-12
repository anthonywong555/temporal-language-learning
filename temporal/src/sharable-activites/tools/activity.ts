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

/**
 * Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param array 
 * @returns 
 */

export async function shuffleArray(array: any[]): Promise<any[]> {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}