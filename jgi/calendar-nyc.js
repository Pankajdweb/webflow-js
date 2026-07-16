
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

// Same ordering FullCalendar 1.6.4 uses inside a day cell (compareDaySegments):
// all-day events first, then start time, then title. Used by the list and
// mobile views so every view shows a day's events in the same order.
function compareEvents(a, b) {
    return ((b.allDay ? 1 : 0) - (a.allDay ? 1 : 0)) ||
        ((a.start && b.start) ? a.start.getTime() - b.start.getTime() : 0) ||
        (a.title || '').localeCompare(b.title || '');
}

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

var EVENT_SLUG_PARAM = 'event';

// Adds/removes the event slug query param so the popup URL can be copied and shared.
function setEventSlugInUrl(slug, replace) {
    var url = new URL(window.location.href);
    if (slug) {
        url.searchParams.set(EVENT_SLUG_PARAM, slug);
    } else {
        url.searchParams.delete(EVENT_SLUG_PARAM);
    }
    if (replace) {
        window.history.replaceState(window.history.state, '', url);
    } else {
        window.history.pushState({ eventSlug: slug || null }, '', url);
    }
}

function getEventSlugFromUrl() {
    return new URL(window.location.href).searchParams.get(EVENT_SLUG_PARAM);
}

function openEventPopup(event, skipUrlUpdate) {
    if (!event) return;
    var $overlay = $('[data-js="event-popup-overlay"]');

    if (!skipUrlUpdate) {
        setEventSlugInUrl(event.slug || '', false);
    }

    $overlay.find('[data-js="event-popup-badge-text"]').text(event.category || '');
    $overlay.find('[data-js="event-popup-badge"]').css('display', event.category ? 'flex' : 'none');

    var featureIconClass = getFeatureIconClass(event.feature);
    var $badgeIcon = $overlay.find('[data-js="event-popup-badge-icon"]').removeClass('feature-icon-live feature-icon-pick');
    if (featureIconClass) {
        $badgeIcon.addClass(featureIconClass).css('display', 'inline-block');
    } else {
        $badgeIcon.css('display', 'none');
    }

    $overlay.find('[data-js="event-popup-title"]').text(event.title || '');
    $overlay.find('[data-js="event-popup-date"]').text(event.start ? formatPopupDate(event.start) : '');

    var $venue = $overlay.find('[data-js="event-popup-venue"]');
    $venue.text(event.venue ? event.venue + ' →' : '');
    if (event.venueLink) {
        $venue.attr('href', event.venueLink);
    } else {
        $venue.removeAttr('href');
    }
    $venue.toggle(!!event.venue);

    var timeStr = formatListTime(event);
    $overlay.find('[data-js="event-popup-time"]').text(timeStr || '');

    $overlay.find('[data-js="event-popup-desc"]').html(event.description || '');
    $overlay.find('[data-js="event-popup-desc"]').toggle(!!event.description);

    if (event.image) {
        $overlay.find('[data-js="event-popup-image"]').css('background-image', 'url(' + event.image + ')');
        $overlay.find('[data-js="event-popup-card"]').removeClass('no-image');
    } else {
        $overlay.find('[data-js="event-popup-image"]').css('background-image', '');
        $overlay.find('[data-js="event-popup-card"]').addClass('no-image');
    }

    var $button = $overlay.find('[data-js="event-popup-button"]');
    if (event.url && event.url !== '#') {
        $button.attr('href', event.url).text(event.buttonText || 'DETAILS').show();
    } else {
        $button.hide();
    }

    var tags = event.tags || [];
    var $tags = $overlay.find('[data-js="event-popup-tags"]');
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
    $('[data-js="event-popup-overlay"]').removeClass('open');
    document.body.style.overflow = '';
    setEventSlugInUrl('', true);
}

$(document).ready(function () {
    $('[data-js="event-popup-overlay"]').on('click', function (e) {
        if (e.target === this) closeEventPopup();
    });
    $('[data-js="event-popup-close"]').on('click', closeEventPopup);
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeEventPopup();
    });
    $(document).on('click', '[data-js="cal-list-event-row"]', function (e) {
        e.preventDefault();
        var id = $(this).attr('data-event-id');
        var event = myEvents.filter(function (ev) { return ev.id === id; })[0];
        openEventPopup(event);
    });
    $(window).on('popstate', function () {
        var slug = getEventSlugFromUrl();
        if (!slug) {
            $('[data-js="event-popup-overlay"]').removeClass('open');
            document.body.style.overflow = '';
            return;
        }
        var event = myEvents.filter(function (ev) { return ev.slug === slug; })[0];
        if (event) openEventPopup(event, true);
    });
});

$(document).ready(function () {
    console.log('[cal-debug] document ready. calendar-grid visible=' + $('[data-js="calendar-grid"]').is(':visible') +
        ' width=' + $('[data-js="calendar-grid"]').width());
    $(window).on('resize', function () {
        console.log('[cal-debug] window resize. calendar-grid visible=' + $('[data-js="calendar-grid"]').is(':visible') +
            ' width=' + $('[data-js="calendar-grid"]').width());
    });
    setTimeout(function () {
        console.log('[cal-debug] 200ms delay elapsed, starting loadEvents(). calendar-grid width=' + $('[data-js="calendar-grid"]').width());
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
            var venueLink = fieldData['venue-link'] || fieldData.venueLink || '';

            return {
                id: item && item.id || '',
                slug: fieldData.slug || '',
                title: title,
                start: hasValidDate ? start : null,
                url: buttonLink,
                allDay: !timeValue,
                venue: venueText,
                venueLink: venueLink,
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

        // Only events tagged with this city (case-insensitive) are loaded into the calendar.
        var EVENT_CITY_FILTER = 'NYC';

        function loadEvents() {
            return fetch('https://jgivents.netlify.app/data.json')
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Failed to load calendar data');
                    }
                    return response.json();
                })
                .then(function (payload) {
                    var sourceItems = getDataItems(payload);
                    return sourceItems
                        .filter(function (item) {
                            return item && !item.isArchived && !item.isDraft;
                        })
                        .map(normalizeEventItem)
                        .filter(function (event) {
                            return event && event.title && event.start &&
                                (event.city || '').trim().toLowerCase() === EVENT_CITY_FILTER.toLowerCase();
                        });
                });
        }

        function initCalendar(events) {
            myEvents = events || [];

            var sharedSlug = getEventSlugFromUrl();
            if (sharedSlug) {
                var sharedEvent = myEvents.filter(function (ev) { return ev.slug === sharedSlug; })[0];
                if (sharedEvent) openEventPopup(sharedEvent, true);
            }

            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth();
            var y = date.getFullYear();

            var $calGrid = $('[data-js="calendar-grid"]');
            console.log('[cal-debug] initCalendar called. container visible=' + $calGrid.is(':visible') +
                ' width=' + $calGrid.width() + ' eventsCount=' + myEvents.length +
                ' eventsWithUrl=' + myEvents.filter(function (e) { return !!e.url; }).length);

            var calendar = $calGrid.fullCalendar({
                header: false,
                firstDay: 1,
                weekMode: 'variable',
                selectable: true,
                events: myEvents,
                eventRender: function (event, element) {
                    console.log('[cal-debug] eventRender id=' + event.id +
                        ' title="' + event.title + '"' +
                        ' url=' + JSON.stringify(event.url) +
                        ' tag=' + element.prop('tagName') +
                        ' containerWidth=' + $calGrid.width());
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
                    console.log('[cal-debug] eventClick fired id=' + calEvent.id + ' targetTag=' + jsEvent.target.tagName);
                    jsEvent.preventDefault();
                    openEventPopup(calEvent);
                    return false;
                },
                eventAfterAllRender: function (view) {
                    var $events = $calGrid.find('.fc-event');
                    var anchorCount = $events.filter('a').length;
                    var divCount = $events.filter('div').length;
                    console.log('[cal-debug] eventAfterAllRender: total=' + $events.length +
                        ' asAnchor=' + anchorCount + ' asDiv=' + divCount +
                        ' containerVisible=' + $calGrid.is(':visible') +
                        ' containerWidth=' + $calGrid.width());
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
                    $('[data-js="cal-month-title"]').text(title || '');

                    if (isMobileCal()) {
                        var today = new Date();
                        var currentRaw = $('[data-js="calendar-grid"]').fullCalendar('getDate');
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
                        $('[data-js="calendar-grid"] .fc-day[data-date="' + dateStr + '"]').addClass('fc-state-highlight');

                        renderMobileDay(selectedMobileDate);
                    }

                    $('[data-js="calendar-grid"] .fc-day-number').each(function () {
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
                var now = new Date();
                var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                var isCurrentMonth = (y === today.getFullYear() && m === today.getMonth());
                var grouped = {};
                for (var i = 0; i < myEvents.length; i++) {
                    var ev = myEvents[i];
                    if (!ev.start) continue;
                    if (ev.start.getFullYear() !== y || ev.start.getMonth() !== m) continue;
                    if (isCurrentMonth && ev.start < today) continue;
                    var key = getDateKey(ev.start);
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(ev);
                }
                var keys = Object.keys(grouped).sort();
                var dateGroups = keys.map(function (k) {
                    var parts = k.split('-');
                    var events = grouped[k];
                    events = events.slice().sort(compareEvents);
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
<a href="#" data-event-id="${event.id}" data-js="cal-list-event-row" class="cal-list-event-row w-inline-block">

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
                $('[data-js="cal-list-content"]').html(html);
                var totalGroups = Object.keys(grouped).length;
                if (showAll || totalGroups <= listViewVisibleCount) {
                    $('[data-js="cal-load-more"]').hide();
                } else {
                    $('[data-js="cal-load-more"]').show();
                }
            }

            listViewDate = new Date(y, m, 1);
            buildListView(listViewDate, false);
            $('[data-js="cal-month-title"]').text(getMonthName(listViewDate));

            $('[data-js="cal-view-list"]').on('click', function () {
                $('[data-js="calendar-grid"]').hide();
                $('[data-js="mobile-list"]').hide();
                $('[data-js="cal-list-view"]').show();
                $('.cal-page-title').text('Calendar Page - LIST');
                var calDate = $('[data-js="calendar-grid"]').fullCalendar('getDate');
                listViewDate = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
                listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
                buildListView(listViewDate, false);
                $('[data-js="cal-month-title"]').text(getMonthName(listViewDate));
                $('[data-js="cal-view-grid"]').removeClass('active');
                $('[data-js="cal-view-list"]').addClass('active');
            });

            $('[data-js="cal-view-grid"]').on('click', function () {
                $('[data-js="cal-list-view"]').hide();
                $('[data-js="calendar-grid"]').show();
                $('[data-js="mobile-list"]').css('display', '');
                $('.cal-page-title').text('Calendar Page - CAL');
                $('[data-js="cal-view-list"]').removeClass('active');
                $('[data-js="cal-view-grid"]').addClass('active');
            });

            $('[data-js="cal-load-more"]').on('click', function () {
                listViewVisibleCount += LIST_VIEW_PAGE_SIZE;
                buildListView(listViewDate, false);
            });

            $('[data-js="cal-prev"]').on('click', function () {
                if ($('[data-js="cal-list-view"]').is(':visible')) {
                    listViewDate = new Date(listViewDate.getFullYear(), listViewDate.getMonth() - 1, 1);
                    listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
                    buildListView(listViewDate, false);
                    $('[data-js="cal-month-title"]').text(getMonthName(listViewDate));
                    $('[data-js="cal-load-more"]').show();
                } else {
                    $('[data-js="calendar-grid"]').fullCalendar('prev');
                }
            });

            $('[data-js="cal-next"]').on('click', function () {
                if ($('[data-js="cal-list-view"]').is(':visible')) {
                    listViewDate = new Date(listViewDate.getFullYear(), listViewDate.getMonth() + 1, 1);
                    listViewVisibleCount = LIST_VIEW_PAGE_SIZE;
                    buildListView(listViewDate, false);
                    $('[data-js="cal-month-title"]').text(getMonthName(listViewDate));
                    $('[data-js="cal-load-more"]').show();
                } else {
                    $('[data-js="calendar-grid"]').fullCalendar('next');
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

    var dayEvents = myEvents.filter(function (event) {
        return event.start && sameDay(event.start, date);
    }).sort(compareEvents);

    dayEvents.forEach(function (event) {
        found = true;
        var timeStr = formatListTime(event);
        var featureIconClass = getFeatureIconClass(event.feature);
        var featureIconHtml = featureIconClass ? '<span class="calender-feature-icon cal-list-feature-icon ' + featureIconClass + '"></span>' : '';

        html += `
   <a href="#" data-event-id="${event.id}" data-js="cal-list-event-row" class="cal-list-event-row w-inline-block">

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
    });

    if (!found) {
        html = `<div class="no-events">Check Back Soon for more listings</div>`;
    }

    $('[data-js="mobile-list"]').html(html);
}

function isMobileCal() {
    return window.innerWidth < 768;
}
