// Language translations for VWAT Chatbot
const translations = {
    vi: {
        // Welcome messages
        welcomeMessage: 'Chào mừng đến với Dịch vụ Gia đình VWAT! Tôi ở đây để giúp bạn tìm hiểu về các dịch vụ và chương trình của chúng tôi.',
        helpQuestion: 'Tôi có thể giúp gì cho bạn?',
        
        // Main menu options
        services: 'Dịch vụ',
        programs: 'Chương trình',
        events: 'Sự kiện',
        appointment: 'Đặt lịch hẹn',
        contactInfo: 'Thông tin liên hệ',
        
        // Services submenu
        selectService: 'Vui lòng chọn một dịch vụ:',
        newcomerServices: 'Dịch vụ Người An Cư',
        employmentServices: 'Dịch vụ Việc làm',
        seniorServices: 'Dịch vụ Người cao tuổi',
        youthServices: 'Dịch vụ Thanh thiếu niên',
        
        // Programs
        selectProgram: 'Vui lòng chọn một chương trình:',
        morePrograms: 'Thêm chương trình',
        
        // Quick replies
        yes: 'Có',
        no: 'Không',
        backToMenu: 'Quay lại Menu',
        
        // Follow-up
        anythingElse: 'Tôi có thể giúp gì khác cho bạn không?',
        whatElse: 'Bạn muốn biết thêm điều gì?',
        
        // Goodbye
        goodbye: 'Cảm ơn bạn đã trò chuyện với chúng tôi! Nếu bạn cần giúp đỡ trong tương lai, đừng ngần ngại liên hệ. Chúc bạn một ngày tốt lành! 🌸',
        
        // Service descriptions
        newcomerServicesDesc: 'Các dịch vụ Định cư cho Người nhập cư của chúng tôi bao gồm:<br><br>• Điền đơn<br>• Hỗ trợ ngôn ngữ (ESL / LINC)<br>• Chuẩn bị quốc tịch & Tình trạng<br>• PR, OHIP, Bằng lái xe<br>• Dịch vụ Ủy viên<br>• Khai thuế thu nhập cá nhân<br>• Dịch vụ Dịch thuật (Anh – Việt)<br>• Đơn xin Nhà ở<br>• Đơn xin Phúc lợi xã hội<br>• Thông tin pháp lý<br>• Giấy chứng nhận: Sinh & Tử, Kết hôn & Ly hôn<br>• Di chúc & Lập kế hoạch tang lễ<br><br>📧 Email: newcomers@vwat.org<br>📞 Điện thoại: +1-647-343-8928',
        
        employmentServicesDesc: 'Chúng tôi cung cấp dịch vụ việc làm miễn phí cho người nhập cư:<br><br>• Hỗ trợ Đánh giá Trình độ Học vấn<br>• Viết CV và Phỏng vấn<br>• Hỗ trợ Tìm việc<br>• Đánh giá & Lập kế hoạch Nghề nghiệp<br>• Giáo dục Thường xuyên<br>• Cơ hội Tình nguyện<br><br>📧 Email: employment@vwat.org<br>🔗 Đặt lịch: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>',
        
        seniorServicesDesc: 'Dịch vụ miễn phí cho người cao tuổi bao gồm:<br><br>• Đơn xin OAS, GIS, CPP<br>• Chương trình Chăm sóc Răng miệng cho Người cao tuổi Ontario<br>• Đơn xin Nhà ở được trợ cấp<br>• Lớp thể dục hàng tuần<br>• Tài nguyên Sức khỏe & Chăm sóc sức khỏe<br><br>📧 Email: seniors@vwat.org<br>📞 Điện thoại: +1-647-343-8928',
        
        youthServicesDesc: 'Chương trình cho thanh thiếu niên (13-25 tuổi):<br><br>• Nhóm Thanh thiếu niên & Hội thảo lãnh đạo<br>• Trại Hè<br>• Tình nguyện Lễ hội Văn hóa<br>• Giờ tình nguyện cho tốt nghiệp<br>• Chuyến tham quan & Hoạt động giải trí<br><br>📧 Email: youth@vwat.org<br>📞 Điện thoại: +1-647-343-8928',
        
        // Appointment
        bookAppointmentTitle: 'Đặt lịch hẹn',
        bookAppointmentDesc: '📅 <strong>Đặt lịch hẹn</strong><br><br>Lên lịch hẹn của bạn cho:<br>• Dịch vụ Định cư<br>• Hỗ trợ Việc làm<br>• Chương Trình Khai Thuế Miễn phí<br>• Viết CV<br>• Và hơn thế nữa!<br><br>💡 <strong>Lưu ý:</strong> Vui lòng ghi rõ qua email bạn muốn đặt lịch hẹn trực tiếp hay trực tuyến.',
        bookAppointmentButton: 'Đặt lịch hẹn ngay',
        
        // Contact
        contactInfoDesc: '📍 <strong>Địa chỉ:</strong> 1756 St. Clair Ave West, Toronto ON M6N 1J3<br><br>📞 <strong>Điện thoại:</strong> +1-647-343-8928<br>📧 <strong>Email:</strong> info@vwat.org<br>🌐 <strong>Website:</strong> <a href="https://www.vwat.org" target="_blank">www.vwat.org</a><br><br>⏰ <strong>Giờ làm việc:</strong> Thứ 2-6: 9:00 SA - 4:30 CH<br>(Đóng cửa cuối tuần và ngày lễ)',
        
        // More Programs
        moreProgramsDesc: '🎉 <strong>Khám phá Thêm Chương trình!</strong><br><br>Truy cập trang sự kiện của chúng tôi để xem tất cả các chương trình sắp tới bao gồm:<br>• Lễ hội Tết Nguyên Đán<br>• Trại Hè<br>• Lễ hội Trung Thu<br>• Sự kiện Cộng đồng & nhiều hơn nữa<br><br>🌟 <strong>Nhiều Chương trình & Sự kiện Đang Chờ Đón!</strong><br>Tham gia cùng chúng tôi để tham gia các lớp học liên tục, lễ hội theo mùa và các hoạt động cộng đồng đặc biệt dành cho người nhập cư, người cao tuổi, thanh thiếu niên và gia đình.<br><br>🔗 <a href="https://www.vwat.org/events/" target="_blank">Xem Tất cả Chương trình & Sự kiện</a>',
        
        // Error messages
        errorMessage: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ chúng tôi trực tiếp tại info@vwat.org hoặc +1-647-343-8928.',
        loadingPrograms: 'Đang tải chương trình... Vui lòng đợi một chút.',
        unableToLoadPrograms: 'Xin lỗi, không thể tải chương trình. Vui lòng thử lại hoặc liên hệ chúng tôi trực tiếp.',
        noProgramsAvailable: 'Không có chương trình nào vào lúc này.',
        noNewPrograms: 'Hiện không có chương trình mới nào.',
        wouldYouLike: 'Bạn có muốn:',
        defaultMessage: 'Tôi ở đây để giúp đỡ! Vui lòng chọn một tùy chọn từ menu.',
        errorProcessing: 'Xin lỗi, tôi không thể xử lý câu hỏi của bạn. Vui lòng thử lại hoặc chọn từ các tùy chọn menu.',
        errorOccurred: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ chúng tôi tại info@vwat.org hoặc +1-647-343-8928.',
        
        // Input placeholder
        inputPlaceholder: 'Nhập câu hỏi của bạn...',
        
        // Language selector
        languageLabel: 'Ngôn ngữ:',
        
        // Events
        upcomingEvents: 'Sự kiện sắp tới',
        noEventsAvailable: 'Không có sự kiện nào sắp tới.',
        viewFullCalendar: 'Xem Lịch Đầy đủ',
        registerEvent: 'Đăng ký',
        eventsThisMonth: 'Sự kiện trong tháng này',
        spotsAvailable: 'Chỗ trống',
        date: 'Ngày',
        time: 'Giờ'
    },
    
    en: {
        // Welcome messages
        welcomeMessage: 'Welcome to VWAT Family Services! I\'m here to help you learn about our services and programs.',
        helpQuestion: 'What can I help you with?',
        
        // Main menu options
        services: 'Services',
        programs: 'Programs',
        events: 'Events',
        appointment: 'Appointment',
        contactInfo: 'Contact Information',
        
        // Services submenu
        selectService: 'Please select a service:',
        newcomerServices: 'Newcomer Services',
        employmentServices: 'Employment Services',
        seniorServices: 'Senior Services',
        youthServices: 'Youth Services',
        
        // Programs
        selectProgram: 'Please select a program:',
        morePrograms: 'More Programs',
        
        // Quick replies
        yes: 'Yes',
        no: 'No',
        backToMenu: 'Back to Menu',
        
        // Follow-up
        anythingElse: 'Can I help you with anything else?',
        whatElse: 'What else would you like to know?',
        
        // Goodbye
        goodbye: 'Thank you for chatting with us! If you need help in the future, feel free to reach out. Have a great day! 🌸',
        
        // Service descriptions
        newcomerServicesDesc: 'Our Newcomer Settlement services include:<br><br>• Form Filling<br>• Language Support (ESL / LINC)<br>• Citizenship Preparation & Status<br>• PR, OHIP, Driver\'s license<br>• Commissioner Services<br>• Personal Income Tax filing<br>• Translation Services (English – Vietnamese)<br>• Housing Applications<br>• Social Benefits Applications<br>• Legal Information<br>• Certificates for: Birth & Death, Marriage & Divorce<br>• Wills & Funeral Planning<br><br>📧 Email: newcomers@vwat.org<br>📞 Phone: +1-647-343-8928',
        
        employmentServicesDesc: 'We offer free employment services for newcomers:<br><br>• Education Credential Evaluation Assistance<br>• Resume and Interview<br>• Job Search Support<br>• Career Assessment & Planning<br>• Continuing Education<br>• Volunteer Opportunities<br><br>📧 Email: employment@vwat.org<br>🔗 Book: <a href="https://www.vwat.org/appointments/" target="_blank">www.vwat.org/appointments</a>',
        
        seniorServicesDesc: 'Free services for seniors include:<br><br>• OAS, GIS, CPP applications<br>• Ontario Seniors Dental Care Program<br>• Subsidized housing applications<br>• Weekly fitness classes<br>• Health & wellness resources<br><br>📧 Email: seniors@vwat.org<br>📞 Phone: +1-647-343-8928',
        
        youthServicesDesc: 'Youth programs (ages 13-25):<br><br>• Youth Group & leadership workshops<br>• Summer Day Camp<br>• Cultural festival volunteering<br>• Volunteer hours for graduation<br>• Field trips & recreational activities<br><br>📧 Email: youth@vwat.org<br>📞 Phone: +1-647-343-8928',
        
        // Appointment
        bookAppointmentTitle: 'Book an Appointment',
        bookAppointmentDesc: '📅 <strong>Book an Appointment</strong><br><br>Schedule your appointment for:<br>• Settlement Services<br>• Employment Support<br>• Free Tax Clinic<br>• Resume Writing<br>• And more!<br><br>💡 <strong>Note:</strong> Please specify by email whether you want an in-person or online appointment.',
        bookAppointmentButton: 'Book Your Appointment Now',
        
        // Contact
        contactInfoDesc: '📍 <strong>Address:</strong> 1756 St. Clair Ave West, Toronto ON M6N 1J3<br><br>📞 <strong>Phone:</strong> +1-647-343-8928<br>📧 <strong>Email:</strong> info@vwat.org<br>🌐 <strong>Website:</strong> <a href="https://www.vwat.org" target="_blank">www.vwat.org</a><br><br>⏰ <strong>Hours:</strong> Mon-Fri 9:00 AM - 4:30 PM<br>(Closed weekends & holidays)',
        
        // More Programs
        moreProgramsDesc: '🎉 <strong>Explore More Programs & Events!</strong><br><br>Visit our events page to see all upcoming programs including:<br>• Lunar New Year Celebration<br>• Summer Camp<br>• Mid-Autumn Children\'s Lantern Festival<br>• Community Events & more<br><br>🌟 <strong>More Programs & Events Await!</strong><br>Join us for ongoing classes, seasonal festivals, and special community activities for newcomers, seniors, youth, and families.<br><br>🔗 <a href="https://www.vwat.org/events/" target="_blank">View All Programs & Events</a>',
        
        // Error messages
        errorMessage: 'Sorry, an error occurred. Please try again or contact us directly at info@vwat.org or +1-647-343-8928.',
        loadingPrograms: 'Loading programs... Please wait a moment.',
        unableToLoadPrograms: 'Sorry, unable to load programs. Please try again or contact us directly.',
        noProgramsAvailable: 'No programs available at the moment.',
        noNewPrograms: 'No new programs available at the moment.',
        wouldYouLike: 'Would you like to:',
        defaultMessage: 'I\'m here to help! Please choose an option from the menu.',
        errorProcessing: 'Sorry, I couldn\'t process your question. Please try again or select from the menu options.',
        errorOccurred: 'Sorry, an error occurred. Please try again or contact us at info@vwat.org or +1-647-343-8928.',
        
        // Input placeholder
        inputPlaceholder: 'Type your question...',
        
        // Language selector
        languageLabel: 'Language:',
        
        // Events
        upcomingEvents: 'Upcoming Events',
        noEventsAvailable: 'No upcoming events available.',
        viewFullCalendar: 'View Full Calendar',
        registerEvent: 'Register',
        eventsThisMonth: 'Events This Month',
        spotsAvailable: 'spots available',
        date: 'Date',
        time: 'Time'
    }
};

// Global language state
let currentLanguage = 'vi'; // Default to Vietnamese

// Get translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Set language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('vwat_language', lang);
}

// Get saved language
function getSavedLanguage() {
    return localStorage.getItem('vwat_language') || 'vi';
}

// Initialize language on load
currentLanguage = getSavedLanguage();
