/**
 * Fixed bootstrap run before paint. Props are read from `document.currentScript`
 * data attributes (JSON for ids) so the script body is never assembled from
 * user input. A stored custom CSS sheet wins over a built-in id.
 */
export const IDENTITY_BOOTSTRAP_SOURCE = `(function(){var s=document.currentScript;if(!s)return;var a=JSON.parse(s.getAttribute("data-ids")||"[]"),k=s.getAttribute("data-storage-key"),c=s.getAttribute("data-custom-key"),v=s.getAttribute("data-default");if(v===null||v==="")v=null;var ok=s.getAttribute("data-opt-in-key"),opt=!ok||localStorage.getItem(ok)==="1";try{if(opt){var css=c&&localStorage.getItem(c);if(css){var st=document.querySelector('style[data-slot="identity-custom-sheet"]');if(!st){st=document.createElement("style");st.setAttribute("data-slot","identity-custom-sheet");(document.head||document.documentElement).appendChild(st)}st.textContent=css;var x=localStorage.getItem(k);document.documentElement.setAttribute("data-identity",x||"custom");return}var x=localStorage.getItem(k);if(x&&a.indexOf(x)>-1)v=x}}catch(e){}if(v)document.documentElement.setAttribute("data-identity",v)})()`;
