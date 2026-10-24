import {
    CalendarDays,
    Circle,
    Trophy,
} from "lucide-react";

import styles from "./circuit-calendar.module.css";
import type { CalendarEvent } from "@/domains/content/home-data";

type CircuitCalendarProps = {
    events: CalendarEvent[];
    masterFinal: { date: string; status: string } | null;
};

export function CircuitCalendar({ events, masterFinal }: CircuitCalendarProps) {
    return (
        <div className={styles.calendar}>
            {events.map((event) => (
                <article
                    className={`${styles.event} ${event.state === "featured" ? styles.featured : ""}`}
                    key={event.number}
                >
                    <div className={styles.eventTop}>
                        <strong>{event.number}</strong>
                        {event.state === "featured" && <CalendarDays size={17} />}
                    </div>

                    <span className={styles.date}>{event.date}</span>
                    <p>{event.venue}</p>
                    <span className={styles.status}>
                        <Circle size={8} fill="currentColor" />
                        {event.status}
                    </span>
                </article>
            ))}

            {masterFinal && (
                <article className={styles.master}>
                    <Trophy size={24} />
                    <strong>
                        MÁSTER
                        <br />
                        FINAL
                    </strong>
                    <span>{masterFinal.date}</span>
                    <small>{masterFinal.status}</small>
                </article>
            )}

            {events.length === 0 && !masterFinal && (
                <p role="status">El calendario oficial se publicará cuando la organización confirme las pruebas.</p>
            )}
        </div>
    );
}