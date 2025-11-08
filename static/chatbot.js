const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Store programs data
let programsData = [];
let programsLoaded = false;

// Load programs data from JSON
fetch('data/programs.json')
  .then(response => response.json())
  .then(data => {
    programsData = data;
    programsLoaded = true;
    console.log('Programs loaded:', programsData);
  })
  .catch(error => {
    console.error('Error loading programs:', error);
    programsData = [];
    programsLoaded = true;
  });

// Initial welcome message
setTimeout(() => {
    addBotMessage('Welcome to VWAT Family Services! I\'m here to help you learn about our services and programs.');
    setTimeout(() => {
        addBotMessageWithOptions('What can I help you with?', [
            'Services',
            'Programs',
            'Appointment',
            'Contact Information'
        ]);
    }, 2000);
}, 500);

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
        if (reply === 'Yes') {
            addBotMessageWithOptions('What else would you like to know?', [
                'Services',
                'Programs',
                'Appointment',
                'Contact Information'
            ]);
        } else {
            addBotMessage('Thank you for chatting with us! If you need help in the future, feel free to reach out. Have a great day! 🌸');
        }
    }, 800);
}

function respondToOption(option) {
    let response = '';
    
    switch(option) {
        case 'Services':
            // Show services sub-menu
            addBotMessageWithOptions('Please select a service:', [
                'Newcomer Services',
                'Employment Services',
                'Senior Services',
                'Youth Services'
            ]);
            return; // Don't show "Can I help you with anything else?" yet
            
        case 'Programs':
            // Show programs sub-menu - filter by expired=no and news=yes
            if (!programsLoaded) {
                addBotMessage('Loading programs... Please wait a moment.');
                // Retry after a short delay
                setTimeout(() => {
                    if (programsLoaded) {
                        respondToOption('Programs');
                    } else {
                        addBotMessage('Sorry, unable to load programs. Please try again or contact us directly.');
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
                programNames.push('More Programs');
                
                if (programNames.length > 1) {
                    addBotMessageWithOptions('Please select a program:', programNames);
                } else {
                    // Only "More Programs" available
                    addBotMessage('No new programs available at the moment.');
                    setTimeout(() => {
                        addBotMessageWithOptions('Would you like to:', ['More Programs', 'Back to Menu']);
                    }, 500);
                }
            } else {
                addBotMessage('No programs available at the moment.');
                setTimeout(() => {
                    addBotMessageWithOptions('Would you like to:', ['More Programs', 'Back to Menu']);
                }, 500);
            }
            return; // Don't show "Can I help you with anything else?" yet
            
        case 'Newcomer Services':
            response = 'Our Newcomer Settlement services include:<br><br>• Form Filling<br>• Language Support (ESL / LINC)<br>• Citizenship Preparation & Status<br>• PR, OHIP, Driver\'s license<br>• Commissioner Services<br>• Personal Income Tax filing<br>• Translation Services (English – Vietnamese)<br>• Housing Applications<br>• Social Benefits Applications<br>• Legal Information<br>• Certificates for: Birth & Death, Marriage & Divorce<br>• Wills & Funeral Planning<br><br>📧 Email: newcomers@vwat.org<br>📞 Phone: +1-647-343-8928';
            break;
        case 'Employment Services':
            response = 'We offer free employment services for newcomers:<br><br>• Education Credential Evaluation Assistance<br>• Resume and Interview<br>• Job Search Support<br>• Career Assessment & Planning<br>• Continuing Education<br>• Volunteer Opportunities<br><br>📧 Email: employment@vwat.org<br>🔗 Book: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>';
            break;
        case 'Senior Services':
            response = 'Free services for seniors include:<br><br>• OAS, GIS, CPP applications<br>• Ontario Seniors Dental Care Program<br>• Subsidized housing applications<br>• Weekly fitness classes<br>• Health & wellness resources<br><br>📧 Email: seniors@vwat.org<br>📞 Phone: +1-647-343-8928';
            break;
        case 'Youth Services':
            response = 'Youth programs (ages 13-25):<br><br>• Youth Group & leadership workshops<br>• Summer Day Camp<br>• Cultural festival volunteering<br>• Volunteer hours for graduation<br>• Field trips & recreational activities<br><br>📧 Email: youth@vwat.org<br>📞 Phone: +1-647-343-8928';
            break;
        case 'More Programs':
            response = '🌟 <strong>More Programs & Events Await!</strong><br>Join us for ongoing classes, seasonal festivals, and special community activities for newcomers, seniors, youth, and families.<br><br>🔗 <a href="https://www.vwat.org/events/" target="_blank">View All Programs & Events</a>';
            break;
        case 'Appointment':
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot';
            messageDiv.innerHTML = `
                <div class="avatar">👩‍💼</div>
                <div class="message-content">
                    📅 <strong>Book an Appointment</strong><br><br>
                    Schedule your appointment for:<br>
                    • Settlement Services<br>
                    • Employment Support<br>
                    • Free Tax Clinic<br>
                    • Resume Writing<br>
                    • And more!<br><br>
                    💡 <strong>Note:</strong> Please specify by email whether you want an in-person or online appointment.<br><br>
                    <div class="button-options">
                        <button class="option-button" onclick="window.open('https://www.vwat.org/appointments/', '_blank')">Book Your Appointment Now</button>
                    </div>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            scrollToBottom();
            setTimeout(() => {
                addBotMessageWithQuickReplies('Can I help you with anything else?', ['Yes', 'No']);
            }, 500);
            return;
        case 'Contact Information':
            response = '📍 <strong>Address:</strong> 1756 St. Clair Ave West, Toronto ON M6N 1J3<br><br>📞 <strong>Phone:</strong> +1-647-343-8928<br>📧 <strong>Email:</strong> info@vwat.org<br>🌐 <strong>Website:</strong> <a href="https://www.vwat.org" target="_blank">www.vwat.org</a><br><br>⏰ <strong>Hours:</strong> Mon-Fri 9:00 AM - 4:30 PM<br>(Closed weekends & holidays)';
            break;
        case 'Free Tax Clinic':
            response = 'Our Free Tax Clinic offers:<br><br>• Free income tax filing (CRA partnership)<br>• For individuals/families earning under $35,000-$52,500<br>• In-person support with all paperwork<br><br>📋 <strong>Required documents:</strong> Government ID, SIN, T-slips<br>📞 <strong>How to book:</strong> Contact us via phone, email, or visit our website<br>🔗 Book: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>';
            break;
        case 'Food Handler Certificate':
            response = '<strong>Food Handler Certificate Program</strong><br><br>📋 <strong>Cost:</strong> $20 plus tax (certification exam fee)<br>⏱️ <strong>Duration:</strong> About 6 hours to complete course; up to 30 days for final exam<br>✅ <strong>Mandatory:</strong> Yes, required for food service premises in Ontario<br><br>📞 <strong>Contact:</strong> employment@vwat.org<br>🔗 Register: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>';
            break;
        case 'Free English Class':
            response = '<strong>Free English Classes</strong><br><br>We offer:<br>• ESL Conversation Circles (for Permanent Residents)<br>• English for Employment<br>• English Conversation Circle (In-Person)<br><br>📋 <strong>Levels:</strong> Beginner to high-intermediate<br>👥 <strong>Focus:</strong> Conversational English, job readiness, networking<br><br>📞 <strong>Contact:</strong> employment@vwat.org<br>🔗 Register: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>';
            break;
        case 'Citizenship Class':
            response = '<strong>Canadian Citizenship Class</strong><br><br>📋 <strong>Purpose:</strong> Prepare for Canadian citizenship test<br>👥 <strong>Audience:</strong> Newcomers preparing for citizenship<br>✅ <strong>Eligibility:</strong> General newcomers; check with settlement team for specifics<br><br>📞 <strong>Contact:</strong> employment@vwat.org<br>🔗 Register: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>';
            break;
        case 'Back to Menu':
            addBotMessageWithOptions('What can I help you with?', [
                'Services',
                'Programs',
                'Appointment',
                'Contact Information'
            ]);
            return;
        default:
            // Check if it's a program from programs.json
            const program = programsData.find(p => p.name === option);
            if (program) {
                response = program.description;
            } else {
                response = 'I\'m here to help! Please choose an option from the menu.';
            }
            break;
    }
    
    addBotMessage(response);
    
    setTimeout(() => {
        addBotMessageWithQuickReplies('Can I help you with anything else?', ['Yes', 'No']);
    }, 500);
}

function handleUserInput() {
    const text = userInput.value.trim();
    if (text === '') return;
    
    addUserMessage(text);
    userInput.value = '';
    
    // Check for specific intents and route to rule-based responses
    const lowerText = text.toLowerCase();
    
    // Appointment-related queries
    if (lowerText.includes('appointment') || lowerText.includes('book') && (lowerText.includes('appointment') || lowerText.includes('visit') || lowerText.includes('meeting'))) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            respondToOption('Appointment');
        }, 1000);
        return;
    }
    
    // Services-related queries
    if (lowerText.includes('what services') || lowerText.includes('services do you offer')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            respondToOption('Services');
        }, 1000);
        return;
    }
    
    // Programs-related queries  
    if ((lowerText.includes('what programs') || lowerText.includes('programs available') || lowerText.includes('list programs')) && !lowerText.includes('seniors') && !lowerText.includes('youth')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            respondToOption('Programs');
        }, 1000);
        return;
    }
    
    // Contact information queries
    if (lowerText.includes('contact') || lowerText.includes('phone') || lowerText.includes('email') || lowerText.includes('address') || lowerText.includes('location') || lowerText.includes('where is vwat') || lowerText.includes('where are you located')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
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
        body: JSON.stringify({ message: text })
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
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
                addBotMessageWithQuickReplies('Can I help you with anything else?', ['Yes', 'No']);
            }, streamingTime + 500); // Wait for streaming + 500ms buffer
        } else {
            addBotMessage('Sorry, I couldn\'t process your question. Please try again or select from the menu options.');
        }
    })
    .catch(error => {
        removeTypingIndicator();
        console.error('Error:', error);
        addBotMessage('Sorry, an error occurred. Please try again or contact us at info@vwat.org or +1-647-343-8928.');
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
