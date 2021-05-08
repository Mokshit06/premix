/**
* Built with Premix
* Learn more at https://github.com/Mokshit06/premix
*/
import"/build/chunks/chunk.QRCWTI4Z.js";import{b as l,d as a,e as t,f as o,h as f}from"/build/chunks/chunk.5VYKPTN3.js";o();var n=l(a()),e=l(f());o();o();var p="_5c4di50";function u(s){return t.createElement("button",{...s,className:p})}function d(){let{todos:s}=(0,e.useRouteData)(),r=(0,e.usePendingFormSubmit)(),m=(0,n.useRef)(),c=(0,e.useSubmit)();return(0,n.useEffect)(()=>{r&&m.current.reset()},[r]),(0,n.useEffect)(()=>{console.log(s)},[s]),t.createElement("main",null,t.createElement("h2",null,"Todos"),t.createElement("ul",null,(s||[]).map(i=>t.createElement("li",{key:i.id},t.createElement("input",{type:"checkbox",checked:i.complete,onChange:b=>{c({id:i.id,complete:b.target.checked},{replace:!0,method:"put"})}}),i.text)),r&&t.createElement("li",null,t.createElement("input",{type:"checkbox",disabled:!0}),r.get("text"))),t.createElement(e.Form,{ref:m,action:"/todos"},t.createElement("label",null,"Todo:",t.createElement("input",{name:"text",type:"text"})),t.createElement(u,{type:"submit"},"Create")))}export{d as default};
//# sourceMappingURL=/build/chunks/todos.RDD3SLGH.js.map
