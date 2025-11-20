const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Store programs data
let programsData = [];
let programsLoaded = false;

// Store events data
let eventsData = [];
let eventsLoaded = false;

// Generate or retrieve user session ID
function getUserSessionId() {
    let userId = localStorage.getItem('vwat_user_id');
    if (!userId) {
        // Generate a unique user ID: timestamp + random string
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('vwat_user_id', userId);
    }
    return userId;
}

// Get user ID on page load
const USER_SESSION_ID = getUserSessionId();
console.log('User Session ID:', USER_SESSION_ID);

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
                t('settlementHelp'),
                t('jobTraining'),
                t('englishClass'),
                t('formsTax'),
                t('seniorServices'),
                t('youthPrograms'),
                t('volunteerEvents'),
                t('otherNotSure')
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
        button.innerHTML = option;
        button.onclick = () => handleOptionClick(option);
        buttonContainer.appendChild(button);
    });
    
    // Add with streaming effect
    messageDiv.innerHTML = `
        <div class="avatar">👩‍💼</div>
        <div class="message-content">
            <span class="streaming-text"></span>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Stream the text word by word
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
            // Add buttons after streaming completes
            messageDiv.querySelector('.message-content').appendChild(buttonContainer);
            scrollToBottom();
        }
    }, 50); // 50ms delay between words
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
    
    // Add with streaming effect
    messageDiv.innerHTML = `
        <div class="avatar">👩‍💼</div>
        <div class="message-content">
            <span class="streaming-text"></span>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Stream the text word by word
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
            // Add quick reply buttons after streaming completes
            messageDiv.querySelector('.message-content').appendChild(repliesContainer);
            scrollToBottom();
        }
    }, 50); // 50ms delay between words
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

// Helper function to log interactions to CSV via backend
function logInteractionToCSV(userSelection, botResponse) {
    try {
        fetch('/log_interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selection: userSelection,
                response: botResponse,
                language: currentLanguage,
                user_id: USER_SESSION_ID
            })
        }).then(() => {}).catch(() => {});
    } catch (e) {
        // non-blocking
        console.warn('Failed to log interaction', e);
    }
}

function handleQuickReply(reply) {
    addUserMessage(reply);
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        // Check both English and Vietnamese "Yes"
        if (reply === t('yes') || reply === 'Yes' || reply === 'Có') {
            addBotMessageWithOptions(t('helpQuestion'), [
                t('settlementHelp'),
                t('jobTraining'),
                t('englishClass'),
                t('formsTax'),
                t('seniorServices'),
                t('youthPrograms'),
                t('volunteerEvents'),
                t('otherNotSure')
            ]);
        } else {
            addBotMessage(t('goodbye'));
        }
    }, 800);
}

function respondToOption(option) {
    let response = '';
    
    switch(option) {
        // NEW TO CANADA / SETTLEMENT HELP
        case t('settlementHelp'):
        case 'New to Canada / Settlement help':
        case 'Mới đến Canada / Hỗ trợ định cư':
            addBotMessageWithOptions(t('settlementHelpIntro'), [
                t('findDoctor'),
                t('enrollSchool'),
                t('newcomerBenefits'),
                t('immigrationDocs'),
                t('other')
            ]);
            logInteractionToCSV(option, t('settlementHelpIntro'));
            return;
        
        // Settlement Help sub-options
        case t('findDoctor'):
        case 'Finding a family doctor or getting a health card (OHIP card)':
        case 'Tìm bác sĩ gia đình hoặc xin thẻ sức khỏe (thẻ OHIP)':
            response = t('findDoctorResponse');
            break;
        
        case t('enrollSchool'):
        case 'Enrolling children in school':
        case 'Đăng ký con em vào trường':
            response = t('enrollSchoolResponse');
            break;
        
        case t('newcomerBenefits'):
        case 'Applying for newcomer benefits (e.g., Child Benefit, SIN, etc.)':
        case 'Nộp đơn xin phúc lợi người mới đến (ví dụ: Phúc lợi Trẻ em, SIN, v.v.)':
            response = t('newcomerBenefitsResponse');
            break;
        
        case t('immigrationDocs'):
        case 'Understanding immigration or PR documents':
        case 'Hiểu về tài liệu nhập cư hoặc PR':
            response = t('immigrationDocsResponse');
            break;
        
        // Handle "Other" option in Settlement Help - prompt for free text input
        case t('other'):
        case 'Other':
        case 'Khác':
            addBotMessage(t('otherPrompt'), true);
            logInteractionToCSV(option, t('otherPrompt'));
            return; // Don't show "Can I help you with anything else?" - wait for user input
        
        // B. JOB OR TRAINING BRANCH
        case t('jobTraining'):
        case 'Job or training':
        case 'Việc làm hoặc đào tạo':
            addBotMessageWithOptions(t('jobTrainingIntro'), [
                t('jobSearch'),
                t('trainingPrograms'),
                t('other')
            ]);
            logInteractionToCSV(option, t('jobTrainingIntro'));
            return;
        
        case t('jobSearch'):
        case 'Job search support':
        case 'Hỗ trợ tìm kiếm việc làm':
            response = t('jobSearchResponse');
            break;
        
        case t('trainingPrograms'):
        case 'Training programs':
        case 'Chương trình đào tạo':
            response = t('trainingProgramsResponse');
            break;
        
        // C. ENGLISH CLASSES BRANCH
        case t('englishClass'):
        case 'English class':
        case 'Lớp tiếng Anh':
            addBotMessageWithOptions(t('englishClassIntro'), [
                t('joinConversationClass'),
                t('bookYMCAAssessment'),
                t('findClassSchedule'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('englishClassIntro'));
            return;
        
        case t('joinConversationClass'):
        case 'Join VWAT conversation class':
        case 'Tham gia lớp trò chuyện VWAT':
            response = t('joinConversationClassResponse');
            break;
        
        case t('bookYMCAAssessment'):
        case 'Book YMCA Language Assessment / LINC referral':
        case 'Đặt lịch Đánh giá Ngôn ngữ YMCA / giới thiệu LINC':
            response = t('bookYMCAAssessmentResponse');
            break;
        
        case t('findClassSchedule'):
        case 'Find a class that fits my schedule (evening/weekend/full-time/part-time/virtual/in-person)':
        case 'Tìm lớp phù hợp với lịch trình của tôi (buổi tối/cuối tuần/toàn thời gian/bán thời gian/trực tuyến/trực tiếp)':
            response = t('findClassScheduleResponse');
            break;
        
        case t('otherNotSureOption'):
        case 'Other / Not sure':
        case 'Khác / Không chắc':
            addBotMessage(t('otherPrompt'), true);
            logInteractionToCSV(option, t('otherPrompt'));
            return;
        
        // D. FORMS / TAX HELP BRANCH
        case t('formsTax'):
        case 'Forms / tax / benefits help':
        case 'Biểu mẫu / thuế / phúc lợi':
            addBotMessageWithOptions(t('formsTaxIntro'), [
                t('helpWithForms'),
                t('personalIncomeTax'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('formsTaxIntro'));
            return;
        
        case t('helpWithForms'):
        case 'Help with forms (e.g., PR renewal, Canadian Citizenship application, SIN, OHIP, driver\'s licence, and other important forms)':
        case 'Giúp đỡ với biểu mẫu (ví dụ: gia hạn PR, đơn xin Quốc tịch Canada, SIN, OHIP, bằng lái xe và các biểu mẫu quan trọng khác)':
            response = t('helpWithFormsResponse');
            break;
        
        case t('personalIncomeTax'):
        case 'Personal income tax filing':
        case 'Khai thuế thu nhập cá nhân':
            response = t('personalIncomeTaxResponse');
            break;
        
        // E. SENIOR SERVICES BRANCH
        case t('seniorServices'):
        case 'Senior services':
        case 'Dịch vụ người cao tuổi':
            addBotMessageWithOptions(t('seniorServicesIntro'), [
                t('seniorPrograms'),
                t('wellnessBenefits'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('seniorServicesIntro'));
            return;
        
        case t('seniorPrograms'):
        case 'Senior programs & activities':
        case 'Chương trình & hoạt động dành cho người cao tuổi':
            response = t('seniorProgramsResponse');
            break;
        
        case t('wellnessBenefits'):
        case 'Wellness & support services / Social benefits (e.g., Ontario Works, ODSP, OAS, GIS, CPP, subsidized housing)':
        case 'Dịch vụ chăm sóc sức khỏe & hỗ trợ / Phúc lợi xã hội (ví dụ: Ontario Works, ODSP, OAS, GIS, CPP, nhà ở được trợ cấp)':
            response = t('wellnessBenefitsResponse');
            break;
        
        // F. YOUTH PROGRAMS BRANCH
        case t('youthPrograms'):
        case 'Youth programs':
        case 'Chương trình thanh thiếu niên':
            addBotMessageWithOptions(t('youthProgramsIntro'), [
                t('youthActivities'),
                t('careerSkills'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('youthProgramsIntro'));
            return;
        
        case t('youthActivities'):
        case 'Youth programs & activities':
        case 'Chương trình & hoạt động dành cho thanh thiếu niên':
            response = t('youthActivitiesResponse');
            break;
        
        case t('careerSkills'):
        case 'Career & skills support':
        case 'Hỗ trợ nghề nghiệp & kỹ năng':
            response = t('careerSkillsResponse');
            break;
        
        // G. VOLUNTEER / EVENTS / PARTNERSHIPS BRANCH
        case t('volunteerEvents'):
        case 'Volunteer / events / partnerships':
        case 'Tình nguyện / sự kiện / hợp tác':
            addBotMessageWithOptions(t('volunteerEventsIntro'), [
                t('volunteerOpportunities'),
                t('communityEvents'),
                t('partnership'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('volunteerEventsIntro'));
            return;
        
        case t('volunteerOpportunities'):
        case 'Volunteer opportunities':
        case 'Cơ hội tình nguyện':
            response = t('volunteerOpportunitiesResponse');
            break;
        
        case t('communityEvents'):
        case 'Community events':
        case 'Sự kiện cộng đồng':
            response = t('communityEventsResponse');
            break;
        
        case t('partnership'):
        case 'Partnership / collaboration':
        case 'Đối tác / hợp tác':
            addBotMessageWithOptions(t('partnershipIntro'), [
                t('employer'),
                t('organization'),
                t('otherNotSureOption')
            ]);
            logInteractionToCSV(option, t('partnershipIntro'));
            return;
        
        case t('employer'):
        case 'I am an employer looking to hire or post a job':
        case 'Tôi là nhà tuyển dụng muốn thuê hoặc đăng việc làm':
            response = t('employerResponse');
            break;
        
        case t('organization'):
        case 'I am a community organization or agency interested in collaboration':
        case 'Tôi là tổ chức cộng đồng hoặc cơ quan quan tâm đến hợp tác':
            response = t('organizationResponse');
            break;
        
        // H. OTHER / NOT SURE BRANCH
        case t('otherNotSure'):
        case 'Other / Not sure':
        case 'Khác / Không chắc':
            addBotMessage(t('otherNotSureIntro'), true);
            return;
        
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
            logInteractionToCSV(option, t('selectService'));
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
                    logInteractionToCSV(option, t('selectProgram'));
                } else {
                    // Only "More Programs" available
                    addBotMessage(t('noNewPrograms'));
                    logInteractionToCSV(option, t('noNewPrograms'));
                    setTimeout(() => {
                        addBotMessageWithOptions(t('wouldYouLike'), [t('morePrograms'), t('backToMenu')]);
                    }, 500);
                }
            } else {
                addBotMessage(t('noProgramsAvailable'));
                logInteractionToCSV(option, t('noProgramsAvailable'));
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
            logInteractionToCSV(option, t('upcomingEvents'));
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
            logInteractionToCSV(option, t('bookAppointmentDesc'));
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
            logInteractionToCSV(option, t('helpQuestion'));
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
    
    // Log interaction with the generated response text
    logInteractionToCSV(option, response);

    // Check if response mentions contact form, appointment, events, or blog
    const hasContactForm = response.toLowerCase().includes('contact form') || response.toLowerCase().includes('mẫu liên hệ');
    const hasAppointment = response.toLowerCase().includes('appointment') || response.toLowerCase().includes('lịch hẹn') || response.toLowerCase().includes('đặt lịch');
    const hasEvents = response.toLowerCase().includes('events page') || response.toLowerCase().includes('trang sự kiện');
    const hasBlog = response.toLowerCase().includes('blog page') || response.toLowerCase().includes('trang blog');
    
    // Calculate streaming time based on word count (50ms per word + 500ms buffer)
    const wordCount = response.split(' ').length;
    const streamingTime = (wordCount * 50) + 500;
    
    // If response has contact form, appointment, events, or blog links, add buttons with streaming
    if (hasContactForm || hasAppointment || hasEvents || hasBlog) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        // Build buttons HTML based on what's mentioned
        let buttons = [];
        if (hasContactForm) {
            buttons.push(`<button class="option-button" onclick="window.open('https://www.vwat.org/contact-us/', '_blank')">${currentLanguage === 'vi' ? 'Mẫu liên hệ' : 'Contact Form'}</button>`);
        }
        if (hasAppointment) {
            buttons.push(`<button class="option-button" onclick="window.open('https://www.vwat.org/appointments/', '_blank')">${currentLanguage === 'vi' ? 'Đặt lịch hẹn' : 'Book Appointment'}</button>`);
        }
        if (hasEvents) {
            buttons.push(`<button class="option-button" onclick="window.open('https://www.vwat.org/events/', '_blank')">${currentLanguage === 'vi' ? 'Trang Sự kiện' : 'Events Page'}</button>`);
        }
        if (hasBlog) {
            buttons.push(`<button class="option-button" onclick="window.open('https://www.vwat.org/blog/', '_blank')">${currentLanguage === 'vi' ? 'Trang Blog' : 'Blog Page'}</button>`);
        }
        
        const buttonsHTML = buttons.length > 0 ? `<div class="button-options grid-layout">${buttons.join('')}</div>` : '';
        
        // Add message with streaming effect
        messageDiv.innerHTML = `
            <div class="avatar">👩‍💼</div>
            <div class="message-content">
                <span class="streaming-text"></span>
                ${buttonsHTML}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        // Stream the text word by word
        const contentSpan = messageDiv.querySelector('.streaming-text');
        const words = response.split(' ');
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
        // Use streaming effect for regular messages too
        addBotMessage(response, true);
    }
    
    // Wait for streaming to complete before showing "anything else" prompt
    setTimeout(() => {
        addBotMessageWithQuickReplies(t('anythingElse'), [t('yes'), t('no')]);
    }, streamingTime);
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
    
    // Check if input is too short (1-2 words) - ask for more detail
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount <= 2) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            
            const clarificationMsg = currentLanguage === 'vi' 
                ? `Bạn có thể giải thích rõ hơn bạn muốn làm gì với "${text}" không? Ví dụ: bạn cần giúp gì về ${text}?`
                : `Could you please explain more clearly what you want to do with "${text}"? For example: what help do you need regarding ${text}?`;
            
            addBotMessage(clarificationMsg, true);
        }, 800);
        return;
    }
    
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
    
    // KEYWORD ROUTING - Match to VWAT service branches
    // Settlement Help keywords
    if (lowerText.includes('doctor') || lowerText.includes('health card') || lowerText.includes('ohip') || 
        lowerText.includes('school') || lowerText.includes('enroll') || lowerText.includes('children') ||
        lowerText.includes('child benefit') || lowerText.includes('sin') || lowerText.includes('newcomer benefit') ||
        lowerText.includes('immigration') || lowerText.includes('pr card') || lowerText.includes('pr document') ||
        lowerText.includes('permanent resident') || lowerText.includes('settlement') || lowerText.includes('newcomer')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('New to Canada / Settlement help');
        }, 1000);
        return;
    }
    
    // Job/Training keywords
    if (lowerText.includes('job') || lowerText.includes('employment') || lowerText.includes('work') ||
        lowerText.includes('resume') || lowerText.includes('cv') || lowerText.includes('interview') ||
        lowerText.includes('training') || lowerText.includes('career') || lowerText.includes('skills')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Job or training');
        }, 1000);
        return;
    }
    
    // English class keywords
    if (lowerText.includes('english') || lowerText.includes('esl') || lowerText.includes('linc') ||
        lowerText.includes('language class') || lowerText.includes('conversation class') ||
        lowerText.includes('ymca') || lowerText.includes('language assessment')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('English class');
        }, 1000);
        return;
    }
    
    // Forms/Tax keywords
    if (lowerText.includes('form') || lowerText.includes('tax') || lowerText.includes('benefit') ||
        lowerText.includes('driver') || lowerText.includes('licence') || lowerText.includes('license') ||
        lowerText.includes('citizenship') || lowerText.includes('certificate') || lowerText.includes('translation')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Forms / tax / benefits help');
        }, 1000);
        return;
    }
    
    // Senior services keywords
    if (lowerText.includes('senior') || lowerText.includes('elderly') || lowerText.includes('older adult') ||
        lowerText.includes('oas') || lowerText.includes('gis') || lowerText.includes('cpp') ||
        lowerText.includes('odsp') || lowerText.includes('ontario works') || lowerText.includes('pension')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Senior services');
        }, 1000);
        return;
    }
    
    // Youth programs keywords
    if (lowerText.includes('youth') || lowerText.includes('teenager') || lowerText.includes('teen') ||
        lowerText.includes('young adult') || lowerText.includes('student') || lowerText.includes('mentorship')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Youth programs');
        }, 1000);
        return;
    }
    
    // Volunteer/Events keywords
    if (lowerText.includes('volunteer') || lowerText.includes('event') || lowerText.includes('partnership') ||
        lowerText.includes('collaborate') || lowerText.includes('community') || lowerText.includes('employer') ||
        lowerText.includes('hire') || lowerText.includes('job posting')) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            isProcessing = false;
            sendButton.disabled = false;
            respondToOption('Volunteer / events / partnerships');
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
            language: currentLanguage,  // Send current language to backend
            user_id: USER_SESSION_ID  // Send user session ID
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
