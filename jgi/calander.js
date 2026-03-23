
var selectedMobileDate = new Date();

function isMobileCal() {
    return window.innerWidth < 768;
}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// my events array
var myEvents = [];

function formatListTime(event) {
    if (event.timeDisplay) return event.timeDisplay;
    if (event.allDay || !event.start) return '';
    var h = event.start.getHours();
    var m = event.start.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ampm;
}

function getDateKey(d) {
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + padDay(d.getDate());
}

function padDay(d) {
    return (d < 10 ? '0' + d : '' + d);
}

function formatDateHeader(date) {
    var days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    // Use 3-letter month names in list view headers
    var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + padDay(date.getDate());
}

function getMonthName(date) {
    // Return 3-letter month name for header (e.g. Jan, Feb)
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()].substring(0, 3);
}

$(document).ready(function () {
    var eventTitle = 0;
    var startDate = 0;
    var eventUrl = 0;
    var allday = 0;
    var venue = 0;
    var classname = 0;
    var webflowLink = 0;
    var listViewDate = null;
    var listViewVisibleCount = 5;
    var LIST_VIEW_PAGE_SIZE = 5;

    $('.ec-col-item').each(function () {
        var eventTitle = $(this).find('[title]').text();
        var eventImage = $(this).find('[event-image]').attr('src'); // used in calendar + list as event.image
        var startDate = $(this).find('[start-date]').text().replace(/-/g, '-');
        var eventUrl = $(this).find('[url]').text();
        var eventAllday = $(this).find('[allday]').text();
        var eventvenue = $(this).find('[venue-wrap]').text();
        var eventClassName = $(this).find('[classname]').text();
        var webflowLink = $(this).find('[webflow-link]').attr('href');
        var eventLocation = $(this).find('.location').text().trim();
        var popupTrigger = $(this).find('.webflow-link').attr('popup-trigger');

        console.log(eventTitle);
        console.log(startDate);
        console.log(eventUrl);
        console.log(eventAllday);
        console.log(eventClassName);
        console.log(webflowLink);
        console.log(eventvenue);
        var isAllDay = (eventAllday === 'true' || eventAllday === '');
        myEvents.push({
            title: eventTitle,
            start: new Date(startDate),
            url: webflowLink,
            popup: popupTrigger,   // 👈 ADD THIS
            allDay: isAllDay,
            venue: eventvenue,
            className: eventClassName,
            location: eventLocation || '',
            timeDisplay: (!isAllDay && eventAllday) ? eventAllday : null,
            image: eventImage || ''
        });
    });

    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    var calendar = $('#divCalendar').fullCalendar({
        header: false,
        firstDay: 1,
        selectable: true,
        events: myEvents,
       eventRender: function (event, element) {
    var timeStr = '';
    if (event.timeDisplay) {
        timeStr = event.timeDisplay.trim();
    } else if (!event.allDay && event.start) {
        var h = event.start.getHours();
        var m = event.start.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeStr = h + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ampm;
    }
    var iconSrc = event.image ;
    var venueText = event.venue || event.location || '';

    var innerHtml = '<div class="calender-data">' +
        '<div class="calender-data-row">' +
        '<img src="' + iconSrc + '" loading="lazy" alt="" class="calender-icon">' +
        '<div>' + timeStr + '</div>' +
        '</div>' +
        '<div class="calender-data-title">' + event.title + '</div>' +
        '<div>' + venueText + '</div>' +
        '</div>';

    if (event.popup && event.popup !== 'undefined') {
        innerHtml = '<a href="#" popup-trigger="' + event.popup + '" class="fc-event-title-link">' + innerHtml + '</a>';
    }

    element.find('.fc-event-inner').html(innerHtml);
},
        eventClick: function (calEvent, jsEvent, view) {
            if (calEvent.popup && calEvent.popup !== 'undefined') {
                jsEvent.preventDefault();
                var popupEl = document.querySelector('[popup-data="' + calEvent.popup + '"]');
                if (popupEl && typeof gsap !== 'undefined') {
                    gsap.set(popupEl, { display: 'block' });
                    gsap.to(popupEl, { opacity: 1, duration: 0.5, ease: 'power2.out' });
                    document.body.style.overflow = 'hidden';
                }
                return false;
            }
        },

        // viewDisplay: function (view) {
        //     var title = view.title;
        //     if (title && title.indexOf(' ') !== -1) {
        //         title = title.split(' ')[0];
        //     }
        //     $('#calMonthTitle').text(title || '');
        // }
        dayClick: function (date, jsEvent, view) {
            if (!isMobileCal()) return;

            var clickedDate = date && typeof date.toDate === 'function' ? date.toDate() : (date instanceof Date ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate()));
            selectedMobileDate = clickedDate;

            $('.fc-day').removeClass('fc-state-highlight');
            $(jsEvent.currentTarget).addClass('fc-state-highlight');

            renderMobileDay(selectedMobileDate);
        },

        viewDisplay: function (view) {
            var title = view.title;
            if (title) {
                title = title.split(' ')[0].substring(0, 3);
            }
            $('#calMonthTitle').text(title || '');

            if (isMobileCal()) {
                var today = new Date();
                var currentRaw = $('#divCalendar').fullCalendar('getDate');
                var current = currentRaw && typeof currentRaw.toDate === 'function' ? currentRaw.toDate() : (currentRaw instanceof Date ? currentRaw : today);

                if (today.getMonth() === current.getMonth() &&
                    today.getFullYear() === current.getFullYear()) {
                    selectedMobileDate = today;
                } else {
                    selectedMobileDate = new Date(current.getFullYear(), current.getMonth(), 1);
                }

                $('.fc-day').removeClass('fc-state-highlight');
                var m = selectedMobileDate.getMonth() + 1, d = selectedMobileDate.getDate();
                var dateStr = selectedMobileDate.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
                $('#divCalendar .fc-day[data-date="' + dateStr + '"]').addClass('fc-state-highlight');

                renderMobileDay(selectedMobileDate);
            }

            // Show single-digit dates as 01, 02, ... 09 in calendar grid
            $('#divCalendar .fc-day-number').each(function () {
                var $cell = $(this).closest('.fc-day');
                var dataDate = $cell.attr('data-date');
                if (dataDate) {
                    var parts = dataDate.split('-');
                    var day = parseInt(parts[2], 10);
                    if (!isNaN(day)) $(this).text(padDay(day));
                }
            });
        }


    });

    function buildListView(monthDate, showAll) {
        var y = monthDate.getFullYear();
        var m = monthDate.getMonth();
        var grouped = {};
        for (var i = 0; i < myEvents.length; i++) {
            var ev = myEvents[i];
            if (!ev.start) continue;
            if (ev.start.getFullYear() !== y || ev.start.getMonth() !== m) continue;
            var key = getDateKey(ev.start);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(ev);
        }
        var keys = Object.keys(grouped).sort();
        var dateGroups = keys.map(function (k) {
            var parts = k.split('-');
            var events = grouped[k];
            // Sort events within the day by start time (ascending)
            events = events.slice().sort(function (a, b) {
                if (!a.start || !b.start) return 0;
                return a.start.getTime() - b.start.getTime();
            });
            return { date: new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)), events: events };
        });
        if (!showAll && dateGroups.length > listViewVisibleCount) {
            dateGroups = dateGroups.slice(0, listViewVisibleCount);
        }
        var html = '';
        if (dateGroups.length === 0) {
            // No events in this month for list view
            html = '<div class="no-events">Check back soon for more listings</div>';
        } else {
            for (var g = 0; g < dateGroups.length; g++) {
                var group = dateGroups[g];
                html += '<div class="cal-list-date-header">' + formatDateHeader(group.date) + '</div>';
                for (var e = 0; e < group.events.length; e++) {
                    var event = group.events[e];
                    var timeStr = formatListTime(event);
                    var hasPopup = event.popup && event.popup !== 'undefined';
                    var linkHref = hasPopup ? '#' : (event.url && event.url !== '#' ? event.url : '#');
                    var popupAttr = hasPopup ? ' popup-trigger="' + event.popup + '"' : '';
                    html += `
<a href="${linkHref}"${popupAttr} class="cal-list-event-row w-inline-block">

  <div id="w-node-_3c15c504-42af-02bd-af92-08aad5ebfe0e-710cc151" class="cal-list-header">
    
    <div class="cal-list-event-icon"
         style="background-image:url('${event.image || ''}')">
    </div>

    <div class="cal-list-event-title">
      ${event.title}
    </div>

  </div>

  <div id="w-node-c767a613-2eda-5551-06f7-be3e45ab3ad8-710cc151" class="cal-list-event-meta-holder">
    <div class="cal-list-event-meta">${timeStr || ''}</div>
    <div class="cal-list-event-meta">${event.venue || ''}</div>
  </div>

  <div id="w-node-c767a613-2eda-5551-06f7-be3e45ab3add-710cc151" class="cal-list-event-arrow">
    →
  </div>

</a>

`;


                }
            }
        }
        $('.cal-list-content').html(html);
        var totalGroups = Object.keys(grouped).length;
        if (showAll || totalGroups <= listViewVisibleCount) {
            $('.cal-load-more').hide();
        } else {
            $('.cal-load-more').show();
        }
    }

    $('.cal-view-list').on('click', function () {
        $('#divCalendar').hide();
        $('#calListView').show();
        $('.cal-page-title').text('Calendar Page - LIST');
        var calDate = $('#divCalendar').fullCalendar('getDate');
        listViewDate = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
        listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
        buildListView(listViewDate, false);
        $('#calMonthTitle').text(getMonthName(listViewDate));
        $('.cal-view-grid').removeClass('active');
        $('.cal-view-list').addClass('active');
    });

    $('.cal-view-grid').on('click', function () {
        $('#calListView').hide();
        $('#divCalendar').show();
        $('.cal-page-title').text('Calendar Page - CAL');
        $('.cal-view-list').removeClass('active');
        $('.cal-view-grid').addClass('active');
    });

    $('.cal-load-more').on('click', function () {
        listViewVisibleCount += LIST_VIEW_PAGE_SIZE;
        buildListView(listViewDate, false);
    });

    $('.cal-prev').on('click', function () {
        if ($('#calListView').is(':visible')) {
            listViewDate = new Date(listViewDate.getFullYear(), listViewDate.getMonth() - 1, 1);
            listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
            buildListView(listViewDate, false);
            $('#calMonthTitle').text(getMonthName(listViewDate));
            $('.cal-load-more').show();
        } else {
            $('#divCalendar').fullCalendar('prev');
        }
    });

    $('.cal-next').on('click', function () {
        if ($('#calListView').is(':visible')) {
            listViewDate = new Date(listViewDate.getFullYear(), listViewDate.getMonth() + 1, 1);
            listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
            buildListView(listViewDate, false);
            $('#calMonthTitle').text(getMonthName(listViewDate));
            $('.cal-load-more').show();
        } else {
            $('#divCalendar').fullCalendar('next');
        }
    });

});

function renderMobileDay(date) {

    var html = '';
    var found = false;

    myEvents.forEach(function (event) {

        if (!event.start) return;
        if (!sameDay(event.start, date)) return;

        found = true;
        var timeStr = formatListTime(event);
        var hasPopup = event.popup && event.popup !== 'undefined';
        var linkHref = hasPopup ? '#' : (event.url && event.url !== '#' ? event.url : '#');
        var popupAttr = hasPopup ? ' popup-trigger="' + event.popup + '"' : '';

        html += `
   <a popup-trigger="${event.popup}" class="cal-list-event-row w-inline-block">

  <div id="w-node-_3c15c504-42af-02bd-af92-08aad5ebfe0e-710cc151" class="cal-list-header">
    
    <div class="cal-list-event-icon"
         style="background-image:url('${event.image || ''}')">
    </div>

    <div class="cal-list-event-title">
      ${event.title}
    </div>

  </div>

  <div id="w-node-c767a613-2eda-5551-06f7-be3e45ab3ad8-710cc151" class="cal-list-event-meta-holder">
    <div class="cal-list-event-meta">${timeStr || ''}</div>
    <div class="cal-list-event-meta">${event.venue || ''}</div>
  </div>

  <div id="w-node-c767a613-2eda-5551-06f7-be3e45ab3add-710cc151" class="cal-list-event-arrow">
    →
  </div>

</a>


`;
    });

    if (!found) {
        html = `<div class="no-events">Check Back Soon for more listings</div>`;
    }

    $('#mobilelist').html(html);
}

function isMobileCal() {
    return window.innerWidth < 768;
}
