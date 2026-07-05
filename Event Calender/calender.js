
var selectedMobileDate = new Date();

// Events are entered against this timezone in Webflow (site timezone setting).
// A UTC timestamp must always resolve to the same calendar day/time here,
// regardless of the visitor's own browser timezone.
var EVENT_TIME_ZONE = 'America/New_York';

// Builds a Date whose LOCAL getters (getDate/getHours/etc.) report the
// wall-clock day/time in EVENT_TIME_ZONE, no matter what timezone the
// visitor's browser is in.
function toEventLocalDate(utcDate) {
    if (!utcDate || isNaN(utcDate.getTime())) return null;
    var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: EVENT_TIME_ZONE,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).formatToParts(utcDate);
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0; // some engines report midnight as "24"
    return new Date(
        parseInt(map.year, 10),
        parseInt(map.month, 10) - 1,
        parseInt(map.day, 10),
        hour,
        parseInt(map.minute, 10),
        parseInt(map.second, 10)
    );
}

function isMobileCal() {
    return window.innerWidth < 768;
}

// Maps the CMS "feature" label (e.g. "JGI LIVE", "JGI Pick") to its icon class.
function getFeatureIconClass(feature) {
    if (!feature) return '';
    var f = feature.toLowerCase();
    if (f.indexOf('live') !== -1) return 'feature-icon-live';
    if (f.indexOf('pick') !== -1) return 'feature-icon-pick';
    return '';
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

function formatPopupDate(date) {
    var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function openEventPopup(event) {
    if (!event) return;
    var $overlay = $('#eventPopupOverlay');

    $overlay.find('.event-popup-badge-text').text(event.category || '');
    $overlay.find('.event-popup-badge').css('display', event.category ? 'flex' : 'none');

    var featureIconClass = getFeatureIconClass(event.feature);
    var $badgeIcon = $overlay.find('.event-popup-badge-icon').removeClass('feature-icon-live feature-icon-pick');
    if (featureIconClass) {
        $badgeIcon.addClass(featureIconClass).css('display', 'inline-block');
    } else {
        $badgeIcon.css('display', 'none');
    }

    $overlay.find('.event-popup-title').text(event.title || '');
    $overlay.find('.event-popup-date').text(event.start ? formatPopupDate(event.start) : '');

    $overlay.find('.event-popup-venue').text(event.venue ? event.venue + ' →' : '');
    $overlay.find('.event-popup-venue').toggle(!!event.venue);

    var timeStr = formatListTime(event);
    $overlay.find('.event-popup-time').text(timeStr || '');

    $overlay.find('.event-popup-desc').html(event.description || '');
    $overlay.find('.event-popup-desc').toggle(!!event.description);

    if (event.image) {
        $overlay.find('.event-popup-image').css('background-image', 'url(' + event.image + ')');
        $overlay.find('.event-popup-card').removeClass('no-image');
    } else {
        $overlay.find('.event-popup-image').css('background-image', '');
        $overlay.find('.event-popup-card').addClass('no-image');
    }

    var $button = $overlay.find('.event-popup-button');
    if (event.url && event.url !== '#') {
        $button.attr('href', event.url).text(event.buttonText || 'DETAILS').show();
    } else {
        $button.hide();
    }

    var tags = event.tags || [];
    var $tags = $overlay.find('.event-popup-tags');
    if (tags.length) {
        $tags.html(tags.map(function (t) {
            return '<span class="event-popup-tag">' + t + '</span>';
        }).join('')).show();
    } else {
        $tags.hide();
    }

    $overlay.addClass('open');
    document.body.style.overflow = 'hidden';
}

function closeEventPopup() {
    $('#eventPopupOverlay').removeClass('open');
    document.body.style.overflow = '';
}

$(document).ready(function () {
    $('#eventPopupOverlay').on('click', function (e) {
        if (e.target === this) closeEventPopup();
    });
    $('.event-popup-close').on('click', closeEventPopup);
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeEventPopup();
    });
    $(document).on('click', '.cal-list-event-row', function (e) {
        e.preventDefault();
        var id = $(this).attr('data-event-id');
        var event = myEvents.filter(function (ev) { return ev.id === id; })[0];
        openEventPopup(event);
    });
});

$(document).ready(function () {
    setTimeout(function () {
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

        function normalizeEventItem(item) {
            var fieldData = item && item.fieldData ? item.fieldData : item;
            var title = fieldData['event-title'] || fieldData.title || fieldData.name || '';
            var startValue = fieldData['start-date'] || fieldData.startDate || fieldData.start || '';
            var timeValue = fieldData['event-time'] || fieldData.time || '';
            var image = fieldData.thumbnail && fieldData.thumbnail.url ? fieldData.thumbnail.url : '';
            var start = startValue ? toEventLocalDate(new Date(startValue)) : null;
            var hasValidDate = start && !isNaN(start.getTime());
            var buttonLink = fieldData['button-link'] || fieldData.url || '';
            var venueText = fieldData['venue-name'] || fieldData.venueName || '';

            return {
                id: item && item.id || '',
                title: title,
                start: hasValidDate ? start : null,
                url: buttonLink,
                allDay: !timeValue,
                venue: venueText,
                city: fieldData['city-name'] || '',
                category: fieldData['category-name'] || '',
                feature: fieldData['feature-name'] || '',
                className: '',
                location: '',
                timeDisplay: timeValue || null,
                image: image,
                description: fieldData['event-description'] || '',
                buttonText: fieldData['button-text'] || '',
                tags: Array.isArray(fieldData['tags-name']) ? fieldData['tags-name'] : []
            };
        }

        function getDataItems(payload) {
            if (Array.isArray(payload)) return payload;
            if (payload && Array.isArray(payload.items)) return payload.items;
            if (payload && Array.isArray(payload.events)) return payload.events;
            if (payload && payload.collections) {
                var collectionKeys = Object.keys(payload.collections || {});
                for (var i = 0; i < collectionKeys.length; i++) {
                    var collection = payload.collections[collectionKeys[i]];
                    if (collection && Array.isArray(collection.items)) return collection.items;
                    if (collection && Array.isArray(collection.events)) return collection.events;
                    if (collection && Array.isArray(collection)) return collection;
                }
            }
            if (payload && payload.data) {
                if (Array.isArray(payload.data)) return payload.data;
                if (Array.isArray(payload.data.items)) return payload.data.items;
                if (Array.isArray(payload.data.events)) return payload.data.events;
            }
            if (payload && payload.response && Array.isArray(payload.response.items)) return payload.response.items;
            return [];
        }

        function loadEvents() {
            return fetch('https://raw.githubusercontent.com/Pankajdweb/Jgi-Events/main/public/data.json')
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Failed to load calendar data');
                    }
                    return response.json();
                })
                .then(function (payload) {
                    var sourceItems = getDataItems(payload);
                    return sourceItems
                        .map(normalizeEventItem)
                        .filter(function (event) {
                            return event && event.title && event.start;
                        });
                });
        }

        function initCalendar(events) {
            myEvents = events || [];

            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth();
            var y = date.getFullYear();

            var calendar = $('#divCalendar').fullCalendar({
                header: false,
                firstDay: 1,
                weekMode: 'variable',
                selectable: true,
                events: myEvents,
                eventRender: function (event, element) {
                    var timeStr = '';
                    if (event.timeDisplay) {
                        timeStr = event.timeDisplay.trim();
                    } else if (!event.allDay && event.start) {
                        var h = event.start.getHours();
                        var mins = event.start.getMinutes();
                        var ampm = h >= 12 ? 'PM' : 'AM';
                        h = h % 12 || 12;
                        timeStr = h + (mins ? ':' + (mins < 10 ? '0' : '') + mins : '') + ' ' + ampm;
                    }
                    var featureIconClass = getFeatureIconClass(event.feature);
                    var featureIconHtml = featureIconClass ? '<span class="calender-feature-icon ' + featureIconClass + '"></span>' : '';
                    var innerHtml = '<div class="calender-data">' +
                        '<div class="calender-data-row">' +
                        featureIconHtml +
                        '<div class="calender-data-time">' + timeStr + '</div>' +
                        '</div>' +
                        '<div class="calender-data-title">' + event.title + '</div>' +
                        (event.venue ? '<div class="calender-data-venue">' + event.venue + '</div>' : '') +
                        '</div>';

                    element.find('.fc-event-inner').html(innerHtml);
                },
                eventClick: function (calEvent, jsEvent, view) {
                    jsEvent.preventDefault();
                    openEventPopup(calEvent);
                    return false;
                },
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
                    html = '<div class="no-events">Check back soon for more listings</div>';
                } else {
                    for (var g = 0; g < dateGroups.length; g++) {
                        var group = dateGroups[g];
                        html += '<div class="cal-list-date-header">' + formatDateHeader(group.date) + '</div>';
                        for (var e = 0; e < group.events.length; e++) {
                            var event = group.events[e];
                            var timeStr = formatListTime(event);
                            var featureIconClass = getFeatureIconClass(event.feature);
                            var featureIconHtml = featureIconClass ? '<span class="calender-feature-icon cal-list-feature-icon ' + featureIconClass + '"></span>' : '';
                            html += `
<a href="#" data-event-id="${event.id}" class="cal-list-event-row w-inline-block">

  <div id="w-node-_3c15c504-42af-02bd-af92-08aad5ebfe0e-710cc151" class="cal-list-header">


    ${featureIconHtml}
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

            listViewDate = new Date(y, m, 1);
            buildListView(listViewDate, false);
            $('#calMonthTitle').text(getMonthName(listViewDate));

            $('.cal-view-list').on('click', function () {
                $('#divCalendar').hide();
                $('#mobilelist').hide();
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
                $('#mobilelist').css('display', '');
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
        }

        loadEvents().then(initCalendar).catch(function (err) {
            console.error('Calendar data load failed:', err);
            initCalendar([]);
        });
    }, 200);
});

function renderMobileDay(date) {

    var html = '';
    var found = false;

    myEvents.forEach(function (event) {

        if (!event.start) return;
        if (!sameDay(event.start, date)) return;

        found = true;
        var timeStr = formatListTime(event);
        var featureIconClass = getFeatureIconClass(event.feature);
        var featureIconHtml = featureIconClass ? '<span class="calender-feature-icon cal-list-feature-icon ' + featureIconClass + '"></span>' : '';

        html += `
   <a href="#" data-event-id="${event.id}" class="cal-list-event-row w-inline-block">

  <div id="w-node-_3c15c504-42af-02bd-af92-08aad5ebfe0e-710cc151" class="cal-list-header">

    <div class="cal-list-event-icon"
         style="background-image:url('${event.image || ''}')">
    </div>
    ${featureIconHtml}
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