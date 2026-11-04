import {
  runEmptyRepoTutorial,
  runExistingAgentsTutorial,
  runHomeSnippetInit,
  runCursorSetupTutorial,
  runCursorSetupAdoptTutorial,
  withScratchDir,
} from "../fixtures/ai-agent-tutorial.mjs";

withScratchDir((dir) => {
  runEmptyRepoTutorial(dir);
});

withScratchDir((dir) => {
  runExistingAgentsTutorial(dir);
});

withScratchDir((dir) => {
  runHomeSnippetInit(dir);
});

withScratchDir((dir) => {
  runCursorSetupTutorial(dir);
});

withScratchDir((dir) => {
  runCursorSetupAdoptTutorial(dir);
});

console.log("ai-agent-tutorial: ok");
