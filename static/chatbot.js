const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Store programs data
let programsData = [];
let programsLoaded = false;

// Store events data
let eventsData = [];
let eventsLoaded = false;

// Language switching function
function switchLanguage(lang) {
    setLanguage(lang);
    
    // Reload programs for the new language
    programsLoaded = false;
    loadPrograms(lang);
    
    // Update button states
    document.getElementById('langVi').classList.toggle('active', lang === 'vi');
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    
    // Update input placeholder
    userInput.placeholder = t('inputPlaceholder');
    
    // Clear and restart conversation
    chatMessages.innerHTML = '';
    initializeChat();
}

// Initialize chat with current language
function initializeChat() {
    setTimeout(() => {
        addBotMessage(t('welcomeMessage'));
        setTimeout(() => {
            addBotMessageWithOptions(t('helpQuestion'), [
                t('services'),
                t('programs'),
                t('events'),
                t('appointment'),
                t('contactInfo')
            ]);
        }, 2000);
    }, 500);
}

// Set initial language button state on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = getSavedLanguage();
    currentLanguage = savedLang;
    document.getElementById('langVi').classList.toggle('active', savedLang === 'vi');
    document.getElementById('langEn').classList.toggle('active', savedLang === 'en');
    userInput.placeholder = t('inputPlaceholder');
});

// Function to load programs based on language
function loadPrograms(lang) {
    const programFile = lang === 'vi' ? 'data/programs_vietnamese.json' : 'data/programs.json';
    fetch(programFile)
      .then(response => response.json())
      .then(data => {
        programsData = data;
        programsLoaded = true;
        console.log('Programs loaded for', lang, ':', programsData);
      })
      .catch(error => {
        console.error('Error loading programs:', error);
        programsData = [];
        programsLoaded = true;
      });
}

// Function to load events
function loadEvents() {
    fetch('data/events.json')
      .then(response => response.json())
      .then(data => {
        eventsData = data;
        eventsLoaded = true;
        console.log('Events loaded:', eventsData);
      })
      .catch(error => {
        console.error('Error loading events:', error);
        eventsData = [];
        eventsLoaded = true;
      });
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = currentLanguage === 'vi' 
        ? ['Th\u00e1ng 1', 'Th\u00e1ng 2', 'Th\u00e1ng 3', 'Th\u00e1ng 4', 'Th\u00e1ng 5', 'Th\u00e1ng 6', 
           'Th\u00e1ng 7', 'Th\u00e1ng 8', 'Th\u00e1ng 9', 'Th\u00e1ng 10', 'Th\u00e1ng 11', 'Th\u00e1ng 12']
        : ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'];
    
    const days = currentLanguage === 'vi'
        ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return currentLanguage === 'vi' 
        ? `${dayName}, ${day} ${month}`
        : `${dayName}, ${month} ${day}`;
}

// Function to display events calendar
function displayEventsCalendar() {
    if (!eventsLoaded || !eventsData || eventsData.length === 0) {
        return t('noEventsAvailable');
    }
    
    // Sort events by date
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Filter upcoming events (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= today);
    
    if (upcomingEvents.length === 0) {
        return t('noEventsAvailable');
    }
    
    // Create calendar HTML
    let calendarHTML = `<div class="events-calendar">`;
    calendarHTML += `<h3 style="margin-top: 0; color: #7b1fa2;">\ud83d\udcc5 ${t('upcomingEvents')}</h3>`;
    calendarHTML += `<div class="events-grid">`;
    
    upcomingEvents.slice(0, 6).forEach(event => {
        calendarHTML += `
            <div class="event-card">
                <div class="event-header">
                    <strong>${event.title}</strong>
                    <span class="event-category">${event.category}</span>
                </div>
                <div class="event-details">
                    <div>\ud83d\udcc5 ${formatDate(event.date)}</div>
                    <div>\u23f0 ${event.time}</div>
                    ${event.spots ? `<div>\ud83c\udfab ${event.spots}</div>` : ''}
                </div>
                ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                <button class="event-register-btn" onclick="window.open('${event.link}', '_blank')">
                    ${t('registerEvent')}
                </button>
            </div>
        `;
    });
    
    calendarHTML += `</div>`; // Close events-grid
    
    calendarHTML += `
        <div class="view-more-events">
            <button class="option-button" onclick="window.open('https://www.vwat.org/events/', '_blank')">
                ${t('viewFullCalendar')}
            </button>
        </div>
    </div>`;
    
    return calendarHTML;
}

// Load programs for initial language
loadPrograms(currentLanguage);
// Load events
loadEvents();

// Initial welcome message (called after language is initialized)
initializeChat();

function addBotMessage(text, streaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    if (streaming) {
        // Add empty message that will be filled with streaming text
        messageDiv.innerHTML = `
            <div class="avatar">👩‍💼</div>
            <div class="message-content"><span class="streaming-text"></span></div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        // Simulate streaming by displaying words one by one
        const contentSpan = messageDiv.querySelector('.streaming-text');
        const words = text.split(' ');
        let currentIndex = 0;
        
        const streamInterval = setInterval(() => {
            if (currentIndex < words.length) {
                contentSpan.innerHTML += (currentIndex > 0 ? ' ' : '') + words[currentIndex];
                currentIndex++;
                scrollToBottom();
            } else {
                clearInterval(streamInterval);
            }
        }, 50); // 50ms delay between words
    } else {
        messageDiv.innerHTML = `
            <div class="avatar">👩‍💼</div>
            <div class="message-content">${text}</div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
}

function addBotMessageWithOptions(text, options) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-options grid-layout';
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => handleOptionClick(option);
        buttonContainer.appendChild(button);
    });
    
    messageDiv.innerHTML = `
        <div class="avatar">👩‍💼</div>
        <div class="message-content">
            ${text}
        </div>
    `;
    
    messageDiv.querySelector('.message-content').appendChild(buttonContainer);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessageWithQuickReplies(text, replies) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const repliesContainer = document.createElement('div');
    repliesContainer.className = 'quick-replies';
    
    replies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'quick-reply';
        button.textContent = reply;
        button.onclick = () => handleQuickReply(reply);
        repliesContainer.appendChild(button);
    });
    
    messageDiv.innerHTML = `
        <div class="avatar">👩‍💼</div>
        <div class="message-content">
            ${text}
        </div>
    `;
    
    messageDiv.querySelector('.message-content').appendChild(repliesContainer);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="avatar">👤</div>
        <div class="message-content">${text}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="avatar">👩‍💼</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

function handleOptionClick(option) {
    addUserMessage(option);
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        respondToOption(option);
    }, 2000);
}

function handleQuickReply(reply) {
    addUserMessage(reply);
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        // Check both English and Vietnamese "Yes"
        if (reply === t('yes') || reply === 'Yes' || reply === 'Có') {
            addBotMessageWithOptions(t('whatElse'), [
                t('services'),
                t('programs'),
                t('events'),
                t('appointment'),
                t('contactInfo')
            ]);
        } else {
            addBotMessage(t('goodbye'));
        }
    }, 800);
}

function respondToOption(option) {
    let response = '';
    
    switch(option) {
        case t('services'):
        case 'Services':
        case 'Dịch vụ':
            // Show services sub-menu
            addBotMessageWithOptions(t('selectService'), [
                t('newcomerServices'),
                t('employmentServices'),
                t('seniorServices'),
                t('youthServices')
            ]);
            return; // Don't show "Can I help you with anything else?" yet
            
        case t('programs'):
        case 'Programs':
        case 'Chương trình':
            // Show programs sub-menu - filter by expired=no and news=yes
            if (!programsLoaded) {
                addBotMessage(t('loadingPrograms'));
                // Retry after a short delay
                setTimeout(() => {
                    if (programsLoaded) {
                        respondToOption(t('programs'));
                    } else {
                        addBotMessage(t('unableToLoadPrograms'));
                    }
                }, 1000);
                return;
            }
            
            if (programsData && programsData.length > 0) {
                // Filter programs: expired = no AND news = yes
                const activeNewPrograms = programsData.filter(program => 
                    program.expired === 'no' && program.news === 'yes'
                );
                
                // Get program names
                const programNames = activeNewPrograms.map(program => program.name);
                
                // Add "More Programs" button
                programNames.push(t('morePrograms'));
                
                if (programNames.length > 1) {
                    addBotMessageWithOptions(t('selectProgram'), programNames);
                } else {
                    // Only "More Programs" available
                    addBotMessage(t('noNewPrograms'));
                    setTimeout(() => {
                        addBotMessageWithOptions(t('wouldYouLike'), [t('morePrograms'), t('backToMenu')]);
                    }, 500);
                }
            } else {
                addBotMessage(t('noProgramsAvailable'));
                setTimeout(() => {
                    addBotMessageWithOptions(t('wouldYouLike'), [t('morePrograms'), t('backToMenu')]);
                }, 500);
            }
            return; // Don't show "Can I help you with anything else?" yet
            
        case t('events'):
        case 'Events':
        case 'S\u1ef1 ki\u1ec7n':
            // Display events calendar
            const eventsHTML = displayEventsCalendar();
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'message bot';
            eventsDiv.innerHTML = `
                <div class="avatar">\ud83d\udc69\u200d\ud83d\udcbc</div>
                <div class="message-content">
                    ${eventsHTML}
                </div>
            `;
            chatMessages.appendChild(eventsDiv);
            scrollToBottom();
            setTimeout(() => {
                addBotMessageWithQuickReplies(t('anythingElse'), [t('yes'), t('no')]);
            }, 500);
            return;
            
        case t('newcomerServices'):
        case 'Newcomer Services':
        case 'Dịch vụ Người mới đến':
            response = t('newcomerServicesDesc');
            break;
        case t('employmentServices'):
        case 'Employment Services':
        case 'Dịch vụ Việc làm':
            response = t('employmentServicesDesc');
            break;
        case t('seniorServices'):
        case 'Senior Services':
        case 'Dịch vụ Người cao tuổi':
            response = t('seniorServicesDesc');
            break;
        case t('youthServices'):
        case 'Youth Services':
        case 'Dịch vụ Thanh thiếu niên':
            response = t('youthServicesDesc');
            break;
        case t('morePrograms'):
        case 'More Programs':
        case 'Thêm Chương trình':
            response = t('moreProgramsDesc');
            break;
        case t('appointment'):
        case 'Appointment':
        case 'Đặt lịch hẹn':
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot';
            messageDiv.innerHTML = `
                <div class="avatar">👩‍💼</div>
                <div class="message-content">
                    ${t('bookAppointmentDesc')}
                    <div class="button-options">
                        <button class="option-button" onclick="window.open('https://www.vwat.org/appointments/', '_blank')">${t('bookAppointmentButton')}</button>
                    </div>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            scrollToBottom();
            setTimeout(() => {
                addBotMessageWithQuickReplies(t('anythingElse'), [t('yes'), t('no')]);
            }, 500);
            return;
        case t('contactInfo'):
        case 'Contact Information':
        case 'Thông tin liên hệ':
            response = t('contactInfoDesc');
            break;
        case t('backToMenu'):
        case 'Back to Menu':
        case 'Quay lại Menu':
            addBotMessageWithOptions(t('helpQuestion'), [
                t('services'),
                t('programs'),
                t('events'),
                t('appointment'),
                t('contactInfo')
            ]);
            return;
        default:
            // Check if it's a program from programs.json
            const program = programsData.find(p => p.name === option);
            if (program) {
                response = program.description;
            } else {
                response = t('defaultMessage');
            }
            break;
    }
    
    addBotMessage(response);
    
    setTimeout(() => {
        addBotMessageWithQuickReplies(t('anythingElse'), [t('yes'), t('no')]);
    }, 500);
}

// Track if a message is being processed
let isProcessing = false;

function handleUserInput() {
    const text = userInput.value.trim();
    if (text === '' || isProcessing) return;
    
    isProcessing = true;
    addUserMessage(text);
    userInput.value = '';
    sendButton.disabled = true;
    
    // Check for specific intents and route to rule-based responses
    const lowerText = text.toLowerCase();
    
    // Appointment-related queries
    if (lowerText.includes('appointment') || lowerText.includes('book') && (lowerText.includes('appointment') || lowerText.includes('visit') || lowerText.includes('meeting'))) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Appointment');
        }, 1000);
        return;
    }
    
    // Services-related queries
    if (lowerText.includes('what services') || lowerText.includes('services do you offer')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Services');
        }, 1000);
        return;
    }
    
    // Programs-related queries  
    if ((lowerText.includes('what programs') || lowerText.includes('programs available') || lowerText.includes('list programs')) && !lowerText.includes('seniors') && !lowerText.includes('youth')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Programs');
        }, 1000);
        return;
    }
    
    // Contact information queries
    if (lowerText.includes('contact') || lowerText.includes('phone') || lowerText.includes('email') || lowerText.includes('address') || lowerText.includes('location') || lowerText.includes('where is vwat') || lowerText.includes('where are you located')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Contact Information');
        }, 1000);
        return;
    }
    
    showTypingIndicator();
    
    // Use RAG for everything else
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            message: text,
            language: currentLanguage  // Send current language to backend
        })
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        isProcessing = false;
        sendButton.disabled = false;
        
        if (data.status === 'success') {
            // Use streaming effect for RAG responses
            addBotMessage(data.response, true);
            
            // Optionally show sources
            if (data.sources && data.sources.length > 0) {
                const sourcesText = 'Sources: ' + data.sources.map(s => s.source).join(', ');
                console.log(sourcesText);  // Log sources for debugging
            }
            
            // Add follow-up question after streaming completes
            // Calculate total streaming time based on word count
            const words = data.response.split(' ');
            const streamingTime = words.length * 50; // 50ms per word
            
            setTimeout(() => {
                addBotMessageWithQuickReplies(t('anythingElse'), [t('yes'), t('no')]);
            }, streamingTime + 500); // Wait for streaming + 500ms buffer
        } else {
            addBotMessage(t('errorProcessing'));
        }
    })
    .catch(error => {
        removeTypingIndicator();
        isProcessing = false;
        sendButton.disabled = false;
        console.error('Error:', error);
        addBotMessage(t('errorOccurred'));
    });
}

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
