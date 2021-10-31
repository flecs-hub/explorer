
function addEventListenerAll(target, listener, ...otherArguments) {
  // install listeners for all natively triggered events
  for (const key in target) {
    if (/^on/.test(key)) {
      const eventType = key.substr(2);
      target.addEventListener(eventType, listener, ...otherArguments);
    }
  }

  // dynamically install listeners for all manually triggered events, just-in-time before they're dispatched ;D
  const dispatchEvent_original = EventTarget.prototype.dispatchEvent;
  function dispatchEvent(event) {
    target.addEventListener(event.type, listener, ...otherArguments);  // multiple identical listeners are automatically discarded
    dispatchEvent_original.apply(this, arguments);
  }

  EventTarget.prototype.dispatchEvent = dispatchEvent;
  if (EventTarget.prototype.dispatchEvent !== dispatchEvent) throw new Error(`Browser is smarter than you think!`);
}

// usage example
addEventListenerAll(window, (evt) => {
    console.log("Event " + evt.type);
    console.log(evt.target);
});
  
