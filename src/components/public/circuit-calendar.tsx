import {
    CalendarDays,
    Circle,
    Trophy,
} from "lucide-react";

import styles from "./circuit-calendar.module.css";

const events = [
    {
        number: "01",
        date: "12–13 SEP 2026",
        venue: "René Marigil",
        status: "Fecha de referencia",
        state: "planned",
    },
    {
        number: "02",
        date: "14–16 NOV 2026",
        venue: "Sport Padel Sagunto · TTM",
        status: "Por confirmar",
        state: "featured",
    },
    {
        number: "03",
        date: "ENE 2027",
        venue: "Sede por confirmar",
        status: "Por confirmar",
        state: "planned",
    },
    {
        number: "04",
        date: "MAR 2027",
        venue: "Sede por confirmar",
        status: "Por confirmar",
        state: "planned",
    },
    {
        number: "05",
        date: "MAY 2027",
        venue: "Sede por confirmar",
        status: "Por confirmar",
        state: "planned",
    },
    {
        number: "06",
        date: "SEP 2027",
        venue: "Sede por confirmar",
        status: "Por confirmar",
        state: "planned",
    },
];

export function CircuitCalendar() {
    return (
        <div className={styles.calendar}>
            {events.map((event) => (
                <article
                    className={`${styles.event} ${event.state === "featured" ? styles.featured : ""
                        }`}
                    key={event.number}
                >
                    <div className={styles.eventTop}>
                        <strong>{event.number}</strong>

                        {event.state === "featured" && (
                            <CalendarDays size={17} />
                        )}
                    </div>

                    <span className={styles.date}>{event.date}</span>

                    <p>{event.venue}</p>

                    <span className={styles.status}>
                        <Circle size={8} fill="currentColor" />
                        {event.status}
                    </span>
                </article>
            ))}

            <article className={styles.master}>
                <Trophy size={24} />

                <strong>
                    MÁSTER
                    <br />
                    FINAL
                </strong>

                <span>DIC 2027</span>

                <small>Clasificados por confirmar</small>
            </article>
        </div>
    );
}