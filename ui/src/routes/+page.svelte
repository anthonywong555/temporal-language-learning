<script lang="ts">
  // import entire JSON file as a default import
  import jyutpingToChineseJSON from '$lib/data/jyutpingToChinese.json';
	import { page } from '$app/stores';
	import Loading from '@temporalio/ui/holocene/loading.svelte';
	import PageTitle from '@temporalio/ui/components/page-title.svelte';
	import Input from '@temporalio/ui/holocene/input/input.svelte';
	import Button from '@temporalio/ui/holocene/button.svelte';
  import Badge from '@temporalio/ui/holocene/badge.svelte';
  import Toaster from '@temporalio/ui/holocene/toaster.svelte';
  import { toaster } from '@temporalio/ui/stores/toaster';
  import { v4 as uuidv4 } from "uuid";
  import type { TranslationRequest, TranslationResponse, TranslationHistory, TranslationServiceResponse, ChineseCharacter } from '../lib/types';
	
  let requestToInterval = new Map<string, NodeJS.Timer>() // Keep track of all NodeJS.Timer
	let translationRequests:Array<TranslationRequest> = []; // All the translation requests goes here
	// {"query": "now", "workflowId": "uuidv4"}
	let translationResponse:TranslationResponse = { status: '', results: []}; // All the translation responses goes here
	// {"query": "now", "workflowId": "uuidv4", "results": []}
  let translationHistories:Array<TranslationHistory> = [];
  // [{}]

  // Jyupting Typing
  let inputJyutping = "";
  let possibleCharacters:Array<string> = [];
  let displayCharacters:Array<string> = [];
  let currentPage = 0;

  const jyutpingToChineseObject = JSON.parse(JSON.stringify(jyutpingToChineseJSON));
  const jyutpingToChinese:Map<string, Array<string>> = new Map(Object.entries(jyutpingToChineseObject));
  //const jyutpings = Object.keys(jyutpingToChinese);
  const jyutpings = Array.from(jyutpingToChinese.keys());
  //console.log('jyutpings', jyutpings);
  let isJyuptingTyping = false;

	let query = '';
  let currentQuery = '';
  let currentWorkflowId = '';

	async function startTranslation() {
		if(!query) {
      return;
    }

    currentQuery = `${query}`;
    query = '';
    possibleCharacters = [];
    displayCharacters = [];
    inputJyutping = '';

    const aTranslationRequest = {
      query: currentQuery,
      workflowId: uuidv4()
    }
    currentWorkflowId = aTranslationRequest.workflowId;

    translationHistories.push({
        request: aTranslationRequest,
        response: {
          status: 'Schedule',
          results: []
        }
    });

    translationHistories = translationHistories;

    try {
      const response = await fetch('/api/translation', {
        method: 'POST',
        body: JSON.stringify(aTranslationRequest),
        headers: {
          'content-type': 'application/json'
        }
      });
      const interval = setInterval(() => fetchTranslations(aTranslationRequest), 5000); // // Poll every 5 seconds
      translationResponse = {status: '', results: []}
      translationRequests = [...translationRequests, {...aTranslationRequest}];
      requestToInterval.set(aTranslationRequest.workflowId, interval);
    } catch(e) {
      // TODO: Show a Toast Message
      console.error(`An error has occurred`, e);
      return;
    }
	}

  async function fetchTranslations(aTranslationRequest: TranslationRequest) {
    try {
      console.log(`fetchTranslation`, aTranslationRequest);
      const fetchRequest = await fetch(`/api/translation?workflowId=${aTranslationRequest.workflowId}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
      });
      const response = (await fetchRequest.json());
      console.log(`response`, response);

      if(response.status === 'COMPLETED' || response.status === 'FAILED') {
        // The Workflow is completed!
        console.log(`About to stop polling`, aTranslationRequest);
        await stopPollingTranslationResults(aTranslationRequest);
      }

      if(response.status === 'RUNNING' || response.status === 'COMPLETED') {
        //const formattedResponse:TranslationServiceResponse = [];
        for(const aTranslationResponse of response.results) {
          const formattedPossibleTranslations = [];
          for(let aTranslationServiceResponse of aTranslationResponse.possibleTranslations) {
            const chineseTexts = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.chineseText);
            const jyutpings = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.jyutping);
            const cangjieChineseCodes = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.cangjie.chineseCode);
            const cangjieEnglishCodes = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.cangjie.englishCode);

            formattedPossibleTranslations.push({
              chineseText: chineseTexts.join(''),
              jyutping: jyutpings.join(' '),
              cangjieChineseCodes: cangjieChineseCodes.join(' | '),
              cangjieEnglishCodes: cangjieEnglishCodes.join(' | '),
            });
          }

          aTranslationResponse.possibleTranslations = formattedPossibleTranslations;
        }

        console.log(`formattedResponse`, response);

        // Find and Update the History
        const index = translationHistories.findIndex(aHistory => aHistory.request.workflowId == aTranslationRequest.workflowId);
        let newResponse:TranslationResponse = { status: response.status, results: []};
        console.log(`index`, index);
        if(index !== -1) {
          newResponse.results = translationHistories[index].response.results;

          for(const aService of response.results) {
            console.log(`aService.service`, aService.service);
            
            if(!newResponse.results.some((anElement) => anElement.service == aService.service)) {
              newResponse.results.push(aService);
            }
          }

          console.log(`newResponse`, newResponse);

          translationHistories[index] = {
            request: aTranslationRequest,
            response: newResponse,
            isSave: translationHistories[index].isSave
          };

          console.log(`changetranslationHistories[index]`, translationHistories[index]);

          translationHistories = [...translationHistories];
          translationHistories = translationHistories;
          console.log('translationHistories', translationHistories);
        }

        if(currentQuery === aTranslationRequest.query) {
          translationResponse = newResponse;
          console.log(`new translationResponses`, translationResponse);
        }
      }
    } catch(e) {
      console.error(e);
      await stopPollingTranslationResults(aTranslationRequest);
    }
  }

	async function stopPollingTranslationResults(aTranslationRequest: TranslationRequest) {
    clearInterval(requestToInterval.get(aTranslationRequest.workflowId));
    requestToInterval.delete(aTranslationRequest.workflowId);
	}

  async function switchHistory(workflowId: string) {
    const aTranslationHistory = translationHistories.find(aHistory => aHistory.request.workflowId == workflowId);
    if(aTranslationHistory?.response) {
      currentQuery = aTranslationHistory.request.query;
      currentWorkflowId = workflowId;
      translationResponse = aTranslationHistory.response;
    }
  }

  async function saveDeck() {
    try {
      await fetch('/api/anki/deck', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json'
        }
      });

      // Toast Message
      toaster.push({
        message: `Saved the deck!`,
        variant: 'success'
      });
    } catch(e) {
      toaster.push({
        message: `Failed to save the deck.`,
        variant: 'error'
      });
    }
  }

  async function addSearchToDeck(aTranslation: ChineseCharacter, englishText: string, aService: TranslationServiceResponse) {
    try {
      const response = await fetch('/api/anki/card', {
        method: 'POST',
        body: JSON.stringify({
          englishText,
          chineseText: aTranslation.chineseText,
          jyutping: aTranslation.jyutping,
          cangjie: aTranslation.cangjieChineseCodes
        }),
        headers: {
          'content-type': 'application/json'
        }
      });

      // Toast Message
      toaster.push({
        message: `Added '${aTranslation.chineseText}' to the deck!`,
        variant: 'success'
      });

      // Add a Badge
      const aTranslationHistory = translationHistories.find(aHistory => aHistory.request.workflowId == currentWorkflowId);
      if(aTranslationHistory) {
        aTranslation.isSave = true;

        aTranslationHistory.isSave = true;
        translationHistories = [...translationHistories];
        translationHistories = translationHistories;
        console.log(translationHistories);

        translationResponse = aTranslationHistory.response;
      }
    } catch(e) {
      console.error(e);

      toaster.push({
        message: `Failed to add ${aTranslation.chineseText} to the deck.`,
        variant: 'error'
      });
    }
  }

  function findCharacters(query: string) {
    let possibleCharacters:Array<string> = [];
    jyutpings.map((aJyutping: string) => {
        if(aJyutping.startsWith(query)) {
          const chineses = jyutpingToChinese.get(aJyutping);
          console.log('chinese', chineses);
          if(chineses) {
            possibleCharacters = [...possibleCharacters, ...chineses];
          }
        }
      });

    return possibleCharacters;
  }

  function isNumber(str:string) {
    if (typeof str !== 'string') {
      return false;
    }
  return !Number.isNaN(str) && !isNaN(parseFloat(str));
  }
  
  const handleNextPage = () => {
    if ((currentPage + 1) * 9 < possibleCharacters.length) {
      currentPage++;
      updateDisplayCharacters();
    }
  };

  const handlePreviousPage = () => {
    if(currentPage > 0) {
      currentPage--;
      updateDisplayCharacters(); 
    }
  }

  function updateDisplayCharacters() {
    const start = currentPage * 9;
    displayCharacters = possibleCharacters.slice(start, start + 9);
  };

  const allowedCharacters = /^[a-zA-Z0-9]+$/; // Example: Only alphanumeric characters are allowed

  function handleKeyDown(event: KeyboardEvent) {
    console.log('event', event);
    console.log('key', event.key);

    if(event.key === 'Control') {
      isJyuptingTyping = !isJyuptingTyping;
    }

    if(isJyuptingTyping) {
      if (event.key === "Backspace") {
        if (inputJyutping.length > 0) {
          // Remove the last character from otherCharacters
          inputJyutping = inputJyutping.slice(0, -1);
          
          if(inputJyutping === '') {
            displayCharacters = [];
            possibleCharacters = [];
          }
          event.preventDefault(); // Prevent backspace from affecting the input field
        } else if (query.length > 0) {
          // Remove the last character from inputValue if otherCharacters is empty
          //query = query.slice(0, -1);
          //event.preventDefault();
        }
      } else if(event.key === '+') {
        handleNextPage();
        event.preventDefault();
      } else if(event.key === '-') {
        handlePreviousPage();
        event.preventDefault();
      }else if(isNumber(event.key) && inputJyutping.length > 0) {
        let selectedText;
        if(event.key === '0') {
          selectedText = inputJyutping;
        }else if(displayCharacters[parseInt(event.key) - 1]) {
          const chineseText = displayCharacters[parseInt(event.key) - 1];
          selectedText = chineseText;
        }

        const input = event.target;
        const { selectionStart, selectionEnd } = event.target;
        console.log('Selection Start:', selectionStart);
        console.log('Selection End:', selectionEnd);

        // Do something with the selection, e.g., modify the input value
        query = query.slice(0, selectionStart) + selectedText + query.slice(selectionEnd);
        // Update the cursor position
        requestAnimationFrame(() => {
          event.target.selectionStart = event.target.selectionEnd = selectionStart + selectedText.length;
        });
        displayCharacters = [];
        inputJyutping = '';
        possibleCharacters = [];

        event.preventDefault();
      } else if(!allowedCharacters.test(event.key) && event.key !== ' ') {
        event.preventDefault();
        console.log(`ignore1`);
      } else if(
        allowedCharacters.test(event.key) &&  
        !event.metaKey && 
        !event.key.includes('Arrow') && 
        event.key.length === 1) {

        if(isNumber(event.key)) {
          event.preventDefault();
          return;
        }
        
        inputJyutping = `${inputJyutping}${event.key}`;
        if(inputJyutping) {
          possibleCharacters = findCharacters(inputJyutping);
          possibleCharacters = [...possibleCharacters];
          currentPage = 0;
          updateDisplayCharacters();
          //query = '';
          
        }

        event.preventDefault();
      }
    }
  }

  function copyToClipboard(text:string) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied!'))
      .catch(err => console.error('Failed to copy: ', err));
  }
</script>

<PageTitle title="Cantonese Lookup 🔎" url={$page.url.href} />
<Toaster toasts={toaster.toasts} pop={toaster.pop} />
<section class="flex flex">
  <section class="flex flex-col gap-1 items-left" id="past-searches">
    <h1>Past Searches</h1>
    {#each translationHistories as aTranslationHistory}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <article class="card" aria-label={aTranslationHistory.request.workflowId} on:click={() => switchHistory(aTranslationHistory.request.workflowId)}>
        <div class="flex justify-between">
        </div>
        <h3>{aTranslationHistory.request.query}</h3>
        {#if aTranslationHistory?.response?.status === "RUNNING"}
            <Badge type="blue">Running</Badge>
          {:else if aTranslationHistory?.response?.status === "COMPLETED"}
            <Badge type="green">Completed</Badge>
          {:else if aTranslationHistory?.response?.status != ''}
          <Badge type="yellow">{aTranslationHistory.response.status}</Badge>
        {/if}

        {#if aTranslationHistory.isSave} 
          <Badge type="green">Saved</Badge>
        {/if}
      </article>
    {/each}
  </section>
  <section class="flex flex-col gap-7" id="search">
    <section class="flex flex-col items-center">
      {#if isJyuptingTyping}
        Jyupting Typing Enabled
      {/if}
      <br /> 
      {inputJyutping} <br />
      <Input type="text" bind:value={query} on:keydown={handleKeyDown}  label="Enter English or Chinese" id="Input-Field" />
      <Button type="button" on:click={startTranslation}>Submit</Button>
      <ul>
        {#each displayCharacters as character, index}
          <li class="possibleCharacters"> {index + 1}.{character} </li>
        {/each}
        {#if inputJyutping != ''}
          <li class="possibleCharacters"> 0.{inputJyutping} </li>
        {/if}
        {#if (currentPage + 1) * 9 < possibleCharacters.length}
          <li class="possibleCharacters">+</li>
        {/if}
        {#if currentPage != 0 }
          <li class="possibleCharacters">-</li>
        {/if}
      </ul>
    </section>
    <section class="flex flex-col">
      {#if (translationResponse.results.length === 0 && currentQuery != '')}
        <Loading title="Searching for '{currentQuery}'" />
        {:else}
        <section class="flex flex-col">
          {#if currentQuery != '' &&  translationResponse.results.length > 0}
          <section class="flex flex-col gap-7 items-center justify-center">
            <h1>Results for '{currentQuery}'</h1>
          </section>
          {/if}
          <section class="flex responses">
              {#each translationResponse.results as aService}
                {#each aService.possibleTranslations as aTranslation}
                <article class={`${aTranslation?.isSave === true ? 'saveCard card' : 'card'}`} aria-label={aService.service}>
                  <div class="flex justify-between">
                  </div>
                  <h3>Service: {aService.service}</h3>
                  <!--<h3>{aService.model}</h3>-->
                  <h3 on:click={copyToClipboard(aTranslation.chineseText)}>Chinese: {aTranslation.chineseText}</h3>
                  <h3 on:click={copyToClipboard(aTranslation.jyutping)}>Jyutping: {aTranslation.jyutping}</h3>
                  <h3 on:click={copyToClipboard(aTranslation.cangjieChineseCodes)}>Cangjie: {aTranslation.cangjieChineseCodes}</h3>
                  <h3>English Code: {aTranslation.cangjieEnglishCodes}</h3>
                  <Button type="button" on:click={() => addSearchToDeck(aTranslation, currentQuery, aService)}>Add</Button>
                </article>
                {/each}
              {/each}
          </section>
        </section>
      {/if}
      </section>
  </section>
  <section class="flex flex-col gap-1">
    <Button type="button" on:click={() => saveDeck()}>Save</Button>
  </section>
</section>

<style lang="postcss">
  .card {
      @apply ease-out duration-300 transition-all flex flex-col gap-4 h-auto border-[3px] border-gray-900 rounded-xl p-8 z-20 bg-white;
  }

  .saveCard {
      @apply border-green-100;
  }

  .card h3 {
      @apply text-lg font-medium;
  }

  .card a {
      @apply underline;
  }

  .responses {
    width: 100%;
    display: block;
  }

  .responses > * {
    float: left;
  }

  .possibleCharacters {
    float: left;
  }

  #past-searches {
    width: 20%;
    overflow-y: scroll;
    height: 100vh;
  }

  #past-searches > * {
    width: 100%;
  }

  #search {
    width: 80%;
  }
</style>