export const speechTT = () => {


  const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.log("Speech Recognition is not supported in this browser");
} else {
  const r = new SpeechRecognition()
  r.continuous = false;
r.interimResults = false;
  r.maxAlternatives = 1;


  r.onstart = function () {
    
    console.log("Listening... ");
  }

  r.onresult = function (event: any) {
    const transcript = event.results[0][0].transcript;
    console.log("You said: ", transcript);
  }

  r.onerror = function (event: any) {
    console.log("Error: ", event.error);
  }

  r.onend = () => {
    console.log("Speech recognition ended");
  };

  r.start();
}
  
}