/**
 * Fixed bootstrap run before paint. The storage key is read from
 * `document.currentScript` so the body is never assembled from user input.
 */
export const MOTION_BOOTSTRAP_SOURCE =
  '(function(){var s=document.currentScript;if(!s)return;var k=s.getAttribute("data-storage-key")||"zk-motion";try{if(localStorage.getItem(k)==="reduce")document.documentElement.setAttribute("data-motion","reduce")}catch(e){}})()';
