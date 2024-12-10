<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '@temporalio/ui/holocene/loading.svelte';
	import PageTitle from '@temporalio/ui/components/page-title.svelte';
	import Input from '@temporalio/ui/holocene/input/input.svelte';
	import Button from '@temporalio/ui/holocene/button.svelte';
	import { v4 as uuidv4 } from "uuid";
  import type { TranslationRequest, TranslationResponse, TranslationHistory, TranslationServiceResponse, ChineseCharacter } from '../lib/types';
	import { onDestroy } from 'svelte';
	
	let translationRequests:Array<TranslationRequest> = []; // All the translation requests goes here
	// {"query": "now", "workflowId": "uuidv4"}
	let translationResponses:Array<TranslationResponse> = []; // All the translation responses goes here
	// {"query": "now", "workflowId": "uuidv4", "results": []}
  let translationHistories:Array<TranslationHistory> = [];
  // [{}]

	let query = '';
  let currentQuery = '';
	let currentWorkflowId = '';

	async function startTranslation() {
		if(!query) {
      return;
    }

    currentQuery = query;
    
    const aTranslationRequest = {
      query,
      workflowId: uuidv4()
    }
    try {
      const response = await fetch('/api/translation', {
        method: 'POST',
        body: JSON.stringify(aTranslationRequest),
        headers: {
          'content-type': 'application/json'
        }
      });

      console.log('After Start Translation');
      translationHistories.push({
        request: aTranslationRequest,
        response: []
      });
      const interval = setInterval(() => fetchTranslations(aTranslationRequest), 5000); // // Poll every 5 seconds
      translationResponses = [];
      translationRequests = [...translationRequests, {...aTranslationRequest, interval}];
      query = '';
    } catch(e) {
      // TODO: Show a Toast Message
      console.error(`An error has occurred`, e);
      return;
    }
	}

  async function fetchTranslations(aTranslationRequest: TranslationRequest) {
    try {
      const fetchRequest = await fetch(`/api/translation?workflowId=${aTranslationRequest.workflowId}`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
      });
      const response = (await fetchRequest.json());

      if(response.status === 'COMPLETED' || response.status === 'FAILED') {
        // The Workflow is completed!
        await stopPollingTranslationResults(aTranslationRequest);
      }

      if(response.status === 'RUNNING' || response.status === 'COMPLETED') {
        console.log(`old translationResponses`, translationResponses);
        //const formattedResponse:TranslationServiceResponse = [];
        console.log('response', response);
        for(const aTranslationResponse of response.results) {
          const formattedPossibleTranslations = [];
          for(let aTranslationServiceResponse of aTranslationResponse.possibleTranslations) {
            console.log(aTranslationServiceResponse);
            const chineseTexts = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.chineseText);
            const jyutpings = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.jyutping);
            const cangjieChineseCodes = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.cangjie.chineseCode);
            const cangjieEnglishCodes = aTranslationServiceResponse.map((aChineseCharacter:any) => aChineseCharacter.cangjie.englishCode);

            formattedPossibleTranslations.push({
              chineseText: chineseTexts.join(''),
              jyutping: jyutpings.join(' '),
              cangjieChineseCodes: cangjieChineseCodes.join(' | '),
              cangjieEnglishCodes: cangjieEnglishCodes.join(' | ')
            });
          }

          aTranslationResponse.possibleTranslations = formattedPossibleTranslations;
        }


        translationResponses = [response];
        translationResponses = translationResponses;
        console.log(`new translationResponses`, translationResponses);

        // Find and Update the History
        const index = translationHistories.findIndex(aHistory => aHistory.request.workflowId == aTranslationRequest.workflowId);

        console.log('index', index);
        if(index !== -1) {
          translationHistories[index] = {
            request: aTranslationRequest,
            response: translationResponses
          }

          translationHistories = [...translationHistories];

          console.log(`translationHistories`, translationHistories);
        }
      }
    } catch(e) {
      console.error(e);
      await stopPollingTranslationResults(aTranslationRequest);
    }
  }

	async function stopPollingTranslationResults(aTranslationRequest: TranslationRequest) {
    const index = translationRequests.findIndex(aTranslationRequest => aTranslationRequest.workflowId === aTranslationRequest.workflowId);

    if(index !== -1) {
      clearInterval(translationRequests[index].interval);
      translationRequests.splice(index, 1);
      console.log(`deleted interval ${aTranslationRequest}`);
    }
	}

  async function switchHistory(workflowId: string) {
    const aTranslationHistory = translationHistories.find(aHistory => aHistory.request.workflowId == workflowId);
    if(aTranslationHistory?.response) {
      translationResponses = aTranslationHistory.response;
      currentQuery = aTranslationHistory.request.query;
    }
  }
</script>

<PageTitle title="Cantonese Lookup 🔎" url={$page.url.href} />
<section class="flex flex">
  <section class="flex flex-col gap-1 items-left" id="past-searches">
    <h1>Past Searches</h1>
    {#each translationHistories as aTranslationHistory}
      <article class="card" aria-label={aTranslationHistory.request.workflowId} on:click={switchHistory(aTranslationHistory.request.workflowId)}>
        <div class="flex justify-between">
        </div>
        <h3>{aTranslationHistory.request.query}</h3>
      </article>
    {/each}
  </section>
  <section class="flex flex-col gap-7 items-center justify-center" id="search">
    <Input type="text" bind:value={query} label="Enter English or Chinese" id="Input-Field" />
    <Button type="button" on:click={startTranslation}>Submit</Button>
    <div>
      {#if translationRequests.length > 0}
        <Loading title="Searching for '{currentQuery}'" />
        {:else}
        <div>
          {#if currentQuery != ''}
            <h1>Results for '{currentQuery}'</h1>
          {/if}
          {#each translationResponses as aTranslationResponse}
            {#each aTranslationResponse.results as aService}
              {#each aService.possibleTranslations as aTranslation}
              <article class="card" aria-label={aService.service}>
                <div class="flex justify-between">
                </div>
                <h3>Service: {aService.service}</h3>
                <!--<h3>{aService.model}</h3>-->
                <h3>Chinese: {aTranslation.chineseText}</h3>
                <h3>Jyupting: {aTranslation.jyutping}</h3>
                <h3>Cangjie: {aTranslation.cangjieChineseCodes}</h3>
                <h3>English Code: {aTranslation.cangjieEnglishCodes}</h3>
              </article>
              {/each}
            {/each}
          {/each}
        </div>
      {/if}
    </div>
  </section>
</section>

<style lang="postcss">
  .card {
      @apply ease-out duration-300 transition-all flex flex-col gap-4 h-auto border-[3px] border-gray-900 rounded-xl p-8 z-20 bg-white;
  }
  .card h3 {
      @apply text-lg font-medium;
  }

  .card a {
      @apply underline;
  }

  #past-searches {
    width: 20%;
    overflow-y: scroll;
  }

  #past-searches > * {
    width: 100%;
  }

  #search {
    width: 80%;
  }


</style>