const apiUrl = `https://api.openai.com/v1/chat/completions`;

var apiKey = '';
chrome.storage.sync.get('openAIApiKey', function(data) {
  apiKey = data.openAIApiKey;
  if (!apiKey)  // Redirect to options page to prompt user to enter OPENAI API key
    chrome.runtime.openOptionsPage();
  console.log('API key retrieved:', apiKey);
});

var paragraphs;
var question_number = 0;

function getRandomInt(n) {
  return Math.floor(Math.random() * n);
}


// executed in original page JS scope
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var tab = tabs[0];

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: function() {
      function populateParagraphs(cssSelector) {
        var paragraphs = [];
        var paragraphElements = document.querySelectorAll(cssSelector);
        console.log(cssSelector);
        console.log(paragraphElements);
    
        for (var i = 0; i < paragraphElements.length; i++) {
          text = paragraphElements[i].innerText;
          if (text.length > 100) {
            paragraphs.push(text);
          }
        }
        return paragraphs;
      }
    
      var paragraphs = [];

      paragraphs = populateParagraphs('p');

      if (paragraphs.length < 3)
        paragraphs = paragraphs.concat(populateParagraphs('div'));

      if (paragraphs.length < 5)
        paragraphs = paragraphs.concat(populateParagraphs('body'));
      console.log(paragraphs);

      chrome.runtime.sendMessage(paragraphs);
    }
  });
});


// receive paragraphs in extension scope
chrome.runtime.onMessage.addListener(function(message) {
  paragraphs = message;
  newQuestion();
});



function newQuestion() {
  question_number += 1;
  createNewQuestionElements();
  i = getRandomInt(paragraphs.length);
  prompt = "Your response should be just a JSON format with two parameters question and answer. Nothing else, don't write explanations, just JSON. Generate a question and answer from the following text: " + paragraphs[i];
  console.log(prompt);
  const data = {
      messages: [{role: "user", content:prompt}],
      model: "gpt-3.5-turbo",
      max_tokens: 200
  };

  const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + apiKey},
      body: JSON.stringify(data)
  };
  fetch(apiUrl, options)
      .then(response => response.json())
      .then(data => {
          console.log(data);
          if (data.error) {
            document.getElementById("error").innerHTML=data.error.message;
          } else {
            const responseJSON = JSON.parse(data.choices[0].message.content);
            const question = responseJSON['question'];
            const answer = responseJSON['answer'];
            document.getElementById("GPT_question_" + question_number).innerHTML=question;
            document.getElementById("img_loading").remove();

            // create the second message from me
            const messageFromMe = document.createElement('div');
            messageFromMe.classList.add('message', 'from-me');

            // create the div inside the message from me
            const divAnswer = document.createElement('div');
            divAnswer.id = 'GPT_answer_' + question_number;
            
            const spanShowAnswer = document.createElement('span');
            spanShowAnswer.id = 'GPT_show_answer_span' + question_number;
            spanShowAnswer.innerHTML="Show answer"; // answer;

            const spanAnswer = document.createElement('span');
            spanAnswer.id = 'GPT_answer_span' + question_number;
            spanAnswer.innerHTML = answer;
            spanAnswer.style.display = 'none'


            // divAnswer.innerHTML = 'Show Answer';
            messageFromMe.appendChild(spanShowAnswer);
            messageFromMe.appendChild(spanAnswer);

            
            
            var chatbox = document.getElementById("chatbox")
            chatbox.appendChild(messageFromMe);

            document.getElementById(spanShowAnswer.id).addEventListener("click", showAnswer);

            window.scrollTo(0, document.body.scrollHeight);

          }          
      })
      .catch(error => {
          console.log('Error:', error);
      });
}

function createNewQuestionElements() {

    const options = {
      hour12: true,
      hour: 'numeric',
      minute: 'numeric'
    };
    const currentTime =  new Date().toLocaleTimeString('en-US', options);

    var existingNewQuestionButton = document.getElementById("btnNewQuestion");
    if (existingNewQuestionButton)
      existingNewQuestionButton.remove();

    // create the img tag
    const loading_img = document.createElement('img');
    loading_img.id = 'img_loading';
    loading_img.src = 'loading.gif';
    loading_img.width = '50';

    // create the first message from them
    const messageFromThem = document.createElement('div');
    messageFromThem.classList.add('message', 'from-them');

    messageFromThem.appendChild(loading_img);

    // create the div inside the message from them
    const divQuestion = document.createElement('div');
    divQuestion.id = 'GPT_question_' + question_number;
    messageFromThem.appendChild(divQuestion);
    
    // create the timestamp span inside the message from them
    const spanTimestampFromThem = document.createElement('span');
    spanTimestampFromThem.classList.add('timestamp');
    spanTimestampFromThem.style.alignSelf = 'flex-start';
    spanTimestampFromThem.textContent = currentTime;
    messageFromThem.appendChild(spanTimestampFromThem);

    // append both messages to the document body
    var chatbox = document.getElementById("chatbox")
    chatbox.appendChild(messageFromThem);

    // scroll to the bottom
    window.scrollTo(0, document.body.scrollHeight);

}

function showAnswer() {
  spanShowAnswerId = 'GPT_show_answer_span' + question_number;
  spanAnswerId = 'GPT_answer_span' + question_number;


  document.getElementById(spanShowAnswerId).style.display = "none";  // hide 
  document.getElementById(spanAnswerId).style.display = "block"; // show

  document.getElementById(spanShowAnswerId).removeEventListener("click", showAnswer);  // should be clickable only once
  
// scroll down
  window.scrollTo(0, document.body.scrollHeight);

// wait then call new question
  setTimeout(newQuestion, 1000);

}
