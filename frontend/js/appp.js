(function(){
  const e = React.createElement;

  function Appp(props){
    return e('div', { className: 'appp-root' },
      e('h1', null, props.title || 'Appp Component'),
      e('p', null, 'This is the appp.tsx component rendered from appp.js')
    );
  }

  function mount(){
    const root = document.getElementById('appp-root');
    if(!root) return;
    const element = e(Appp, { title: 'Dashboard Appp' });
    if(ReactDOM && ReactDOM.createRoot){
      ReactDOM.createRoot(root).render(element);
    } else if(ReactDOM && ReactDOM.render){
      ReactDOM.render(element, root);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
