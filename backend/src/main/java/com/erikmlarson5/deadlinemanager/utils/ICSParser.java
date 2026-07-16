package com.erikmlarson5.deadlinemanager.utils;

import org.springframework.stereotype.Component;
import com.erikmlarson5.deadlinemanager.dto.ICSPreviewItemDTO;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.data.ParserException;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Categories;
import net.fortuna.ical4j.model.property.Description;
import net.fortuna.ical4j.model.property.DtStart;
import net.fortuna.ical4j.model.property.Summary;

import java.io.IOException;
import java.io.StringReader;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.Temporal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Parses raw ICS calendar content into a list of ICSPreviewItemDTOs.
 */
@Component
public class ICSParser {

    /**
     * Parses raw ICS string content and maps each VEVENT to an ICSPreviewItemDTO.
     * @param icsContent raw ICS text fetched from a calendar URL
     * @param timezone IANA timezone string like "America/Chicago"
     * @param today the user's current local date — used to filter past events
     * @return list of parsed preview items, skipping malformed or past events
     */
    public List<ICSPreviewItemDTO> parse(String icsContent, String timezone, LocalDate today) {
        // Resolve the user's timezone and fall back to UTC if invalid
        ZoneId zoneId = resolveZone(timezone);

        List<ICSPreviewItemDTO> results = new ArrayList<>();

        try {
            // Build a Calendar object from the raw ICS content
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icsContent));

            // Extract all VEVENT components from the calendar
            List<VEvent> events = calendar.getComponents(net.fortuna.ical4j.model.Component.VEVENT);

            for (VEvent event : events) {
                try {
                    ICSPreviewItemDTO item = mapEvent(event, zoneId, today);

                    // mapEvent returns null if the event is malformed or in the past
                    if (item != null) {
                        results.add(item);
                    }
                } catch (Exception e) {
                    // Skip individual malformed events
                }
            }

        } catch (IOException | ParserException e) {
            throw new IllegalArgumentException("Could not parse ICS content: " + e.getMessage());
        }

        return results;
    }

    /**
     * Maps a single VEVENT component to an ICSPreviewItemDTO.
     * Returns null if the event cannot be mapped or is in the past.
     */
    private ICSPreviewItemDTO mapEvent(VEvent event, ZoneId zoneId, LocalDate today) {

        // Title parsing (SUMMARY property)
        Optional<Summary> summaryProp = event.getProperty(Property.SUMMARY);
        if (summaryProp.isEmpty() || summaryProp.get().getValue().isBlank()) {
            return null; 
        }

        String rawTitle = summaryProp.get().getValue().trim();

        // Remove any trailing bracketed course/section tags from the title
        rawTitle = rawTitle.replaceAll("\\s*\\[[A-Z0-9.\\-]+\\]\\s*$", "").trim();

        // Truncate title to match @Size(max = 70) on ICSPreviewItemDTO
        String title = rawTitle.length() > 70 ? rawTitle.substring(0, 67) + "..." : rawTitle;

        // Due date parsing (DTSTART property)
        // The value can be a DATE, a floating DATE-TIME, a UTC DATE-TIME, or a DATE-TIME with an explicit TZID
        Optional<DtStart<Temporal>> dtStartProp = event.getProperty(Property.DTSTART);
        if (dtStartProp.isEmpty()) {
            return null;
        }

        LocalDate dueDate = extractDate(dtStartProp.get(), zoneId);
        if (dueDate == null) {
            return null;
        }

        // Filter out past events
        if (dueDate.isBefore(today)) {
            return null;
        }

        // Parse category (either from CATEGORIES property or from bracketed tag in title)
        String category = extractCategory(event, rawTitle);

        // Truncate to match @Size(max = 20) on ICSPreviewItemDTO
        if (category != null && category.length() > 20) {
            category = category.substring(0, 20);
        }

        // Parse description (DESCRIPTION property)
        Optional<Description> descProp = event.getProperty(Property.DESCRIPTION);
        String description = null;
        if (descProp.isPresent() && !descProp.get().getValue().isBlank()) {
            String raw = descProp.get().getValue().trim();
            // Truncate to match @Size(max = 2000) on ICSPreviewItemDTO
            description = raw.length() > 2000 ? raw.substring(0, 2000) : raw;
        }

        // Create and return the DTO
        ICSPreviewItemDTO item = new ICSPreviewItemDTO();
        item.setTitle(title);
        item.setDueDate(dueDate);
        item.setCategory(category);
        item.setDescription(description);
        item.setAlreadyExists(false);

        return item;
    }

    /**
     * Extracts a LocalDate from a DtStart property, converting to the user's timezone.
     *
     * DtStart<Temporal>.getDate() returns one of several java.time types depending on how the value was written in the ICS file
     * Either a plain date, a floating date-time, a UTC date-time, or a date-time with an explicit TZID.
     */
    private LocalDate extractDate(DtStart<Temporal> dtStart, ZoneId zoneId) {
        try {
            Temporal temporal = dtStart.getDate();

            if (temporal instanceof LocalDate) {
                return (LocalDate) temporal;
            } else if (temporal instanceof ZonedDateTime) {
                return ((ZonedDateTime) temporal).withZoneSameInstant(zoneId).toLocalDate();
            } else if (temporal instanceof Instant) {
                return ((Instant) temporal).atZone(zoneId).toLocalDate();
            } else if (temporal instanceof OffsetDateTime) {
                return ((OffsetDateTime) temporal).atZoneSameInstant(zoneId).toLocalDate();
            } else if (temporal instanceof LocalDateTime) {
                return ((LocalDateTime) temporal).toLocalDate();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Tries to extract a course code or category name from the event by using the CATEGORIES property or by parsing the 
     * bracketed course/section tag from the SUMMARY.
     */
    private String extractCategory(VEvent event, String rawTitle) {

        // Check for CATEGORIES property first
        Optional<Categories> categoriesProp = event.getProperty(Property.CATEGORIES);
        if (categoriesProp.isPresent()) {
            String cat = categoriesProp.get().getValue().trim();
            // CATEGORIES can be comma-separated, so we take the first one
            String first = cat.split(",")[0].trim();
            if (!first.isBlank()) {
                return first;
            }
        }

        // If no CATEGORIES property, try to parse a bracketed course/section tag from the title)
        int openBracket = rawTitle.indexOf('[');
        if (openBracket != -1) {
            int closeBracket = rawTitle.indexOf(']', openBracket + 1);

            if (closeBracket != -1) {
                String potential = rawTitle.substring(openBracket + 1, closeBracket).trim();

                // Check for a course code pattern/digit 
                boolean hasDigit = potential.chars().anyMatch(Character::isDigit);

                if (!potential.isBlank() && hasDigit) {
                    return potential;
                }
            }
        }

        return null;
    }

    /**
     * Safely resolves a timezone string to a ZoneId.
     * Falls back to UTC if the string is null, blank, or unrecognized.
     */
    private ZoneId resolveZone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return ZoneId.of("UTC");
        }
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException e) {
            return ZoneId.of("UTC");
        }
    }
}