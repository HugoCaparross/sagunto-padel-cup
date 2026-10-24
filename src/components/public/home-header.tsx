"use client";

import Image from "next/image";
import Link from "next/link";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    CalendarDays,
    ArrowRight,
    LoaderCircle,
    Menu,
    Search,
    UserRound,
    X,
} from "lucide-react";

import styles from "./home-header.module.css";

const links = [
    { href: "/circuito", label: "El circuito" },
    { href: "/calendario", label: "Calendario" },
    { href: "/ranking", label: "Ranking" },
    { href: "/resultados", label: "Resultados" },
    { href: "/noticias", label: "Noticias" },
    { href: "/clubes", label: "Clubes" },
    { href: "/contacto", label: "Contacto" },
];

type SearchResult = {
    id: string;
    title: string;
    description: string;
    href: string;
    type: string;
};

const typeOrder = [
    "Prueba",
    "Temporada",
    "Categoría",
    "Subgrupo",
    "Jugador/a",
    "Pareja",
    "Partido",
    "Club",
    "Noticia",
    "Patrocinador",
    "Pregunta frecuente",
];

export function HomeHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const headerRef = useRef<HTMLElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestRef = useRef<AbortController | null>(null);

    const closeSearch = useCallback(() => {
        requestRef.current?.abort();
        requestRef.current = null;

        setSearchOpen(false);
        setQuery("");
        setResults([]);
        setLoading(false);
        setSearchError(false);
        setHasSearched(false);
        setActiveIndex(-1);
    }, []);

    const openSearch = useCallback(() => {
        setMenuOpen(false);
        setSearchOpen(true);

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, []);

    useEffect(() => {
        if (!searchOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeSearch();
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) =>
                    Math.min(current + 1, results.length - 1),
                );
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) =>
                    Math.max(current - 1, 0),
                );
            }

            if (
                event.key === "Enter" &&
                activeIndex >= 0 &&
                results[activeIndex]
            ) {
                window.location.assign(results[activeIndex].href);
            }
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (
                headerRef.current &&
                event.target instanceof Node &&
                !headerRef.current.contains(event.target)
            ) {
                closeSearch();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener(
            "pointerdown",
            handlePointerDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
        };
    }, [
        searchOpen,
        closeSearch,
        results,
        activeIndex,
    ]);

    useEffect(() => {
        const normalizedQuery = query.trim();

        requestRef.current?.abort();
        requestRef.current = null;

        if (!searchOpen || normalizedQuery.length < 2) {
            setResults([]);
            setLoading(false);
            setSearchError(false);
            setHasSearched(false);
            setActiveIndex(-1);
            return;
        }

        const controller = new AbortController();
        requestRef.current = controller;

        const timeout = window.setTimeout(async () => {
            setLoading(true);
            setSearchError(false);
            setHasSearched(false);
            setActiveIndex(-1);

            try {
                const response = await fetch(
                    `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
                    {
                        method: "GET",
                        signal: controller.signal,
                        cache: "no-store",
                        headers: {
                            Accept: "application/json",
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error("Error al buscar");
                }

                const data = (await response.json()) as {
                    results?: SearchResult[];
                };

                if (controller.signal.aborted) return;

                setResults(
                    Array.isArray(data.results)
                        ? data.results
                        : [],
                );
                setHasSearched(true);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setResults([]);
                setSearchError(true);
                setHasSearched(true);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query, searchOpen]);

    const groupedResults = typeOrder
        .map((type) => ({
            type,
            items: results.filter(
                (result) => result.type === type,
            ),
        }))
        .filter((group) => group.items.length > 0);

    const handleSearchSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (results.length > 0) {
            const firstResult =
                activeIndex >= 0
                    ? results[activeIndex]
                    : results[0];

            if (firstResult) {
                window.location.assign(firstResult.href);
            }
        }
    };

    return (
        <header className={styles.header} ref={headerRef}>
            <div className={`container ${styles.inner}`}>
                <Link
                    href="/"
                    className={styles.brand}
                    aria-label="Sagunto Padel Cup, inicio"
                    onClick={closeSearch}
                >
                    <Image
                        src="/images/logo-sagunto-padel-cup.png"
                        alt="Sagunto Padel Cup"
                        width={320}
                        height={110}
                        priority
                        className={styles.logoImage}
                    />
                </Link>

                <nav
                    className={styles.desktopNav}
                    aria-label="Navegación principal"
                >
                    <Link
                        href="/"
                        className={styles.active}
                    >
                        Inicio
                    </Link>

                    {links.map((link) => (
                        <Link
                            href={link.href}
                            key={link.href}
                            onClick={closeSearch}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={`${styles.searchButton} ${searchOpen ? styles.searchButtonActive : ""
                            }`}
                        aria-label={
                            searchOpen
                                ? "Cerrar buscador"
                                : "Abrir buscador"
                        }
                        aria-expanded={searchOpen}
                        aria-controls="site-search-panel"
                        onClick={() => {
                            if (searchOpen) {
                                closeSearch();
                            } else {
                                openSearch();
                            }
                        }}
                    >
                        {searchOpen ? (
                            <X size={19} />
                        ) : (
                            <Search size={19} />
                        )}
                    </button>

                    <Link
                        href="/acceso"
                        className={styles.login}
                        onClick={closeSearch}
                    >
                        <UserRound size={14} />
                        Iniciar sesión
                    </Link>

                    <Link
                        href="/inscripcion"
                        className={styles.register}
                        onClick={closeSearch}
                    >
                        <CalendarDays size={14} />
                        Inscripciones
                    </Link>
                </div>

                <button
                    className={styles.menuToggle}
                    type="button"
                    aria-label={
                        menuOpen ? "Cerrar menú" : "Abrir menú"
                    }
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => {
                        closeSearch();
                        setMenuOpen((open) => !open);
                    }}
                >
                    {menuOpen ? (
                        <X size={23} />
                    ) : (
                        <Menu size={23} />
                    )}
                </button>
            </div>

            {searchOpen && (
                <div
                    className={styles.searchOverlay}
                    id="site-search-panel"
                >
                    <div className={styles.searchPanel}>
                        <form
                            className={styles.searchForm}
                            onSubmit={handleSearchSubmit}
                            role="search"
                        >
                            <Search
                                className={styles.searchInputIcon}
                                size={21}
                                aria-hidden="true"
                            />

                            <label
                                className={styles.visuallyHidden}
                                htmlFor="site-search-input"
                            >
                                Buscar en Sagunto Padel Cup
                            </label>

                            <input
                                ref={inputRef}
                                id="site-search-input"
                                className={styles.searchInput}
                                type="search"
                                placeholder="Busca jugadores, pruebas, clubes, noticias..."
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                autoComplete="off"
                                spellCheck={false}
                                maxLength={100}
                                aria-controls="site-search-results"
                                aria-describedby="site-search-hint"
                            />

                            {loading && (
                                <LoaderCircle
                                    size={19}
                                    className={styles.loadingIcon}
                                    aria-label="Buscando"
                                />
                            )}

                            {query.length > 0 && !loading && (
                                <button
                                    type="button"
                                    className={styles.clearSearch}
                                    aria-label="Borrar búsqueda"
                                    onClick={() => {
                                        setQuery("");
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <X size={17} />
                                </button>
                            )}

                            <button
                                type="button"
                                className={styles.closeSearch}
                                onClick={closeSearch}
                                aria-label="Cerrar buscador"
                            >
                                Cerrar
                            </button>
                        </form>

                        <p
                            id="site-search-hint"
                            className={styles.searchHint}
                        >
                            Busca por nombre, categoría, temporada,
                            club o contenido del circuito.
                        </p>

                        <div
                            id="site-search-results"
                            className={styles.searchResults}
                            aria-live="polite"
                            aria-busy={loading}
                        >
                            {query.trim().length < 2 && (
                                <div className={styles.searchMessage}>
                                    <span
                                        className={
                                            styles.searchHintLabel
                                        }
                                    >
                                        BÚSQUEDA GLOBAL
                                    </span>
                                    <p>
                                        Escribe al menos dos caracteres
                                        para empezar.
                                    </p>
                                </div>
                            )}

                            {loading && (
                                <div className={styles.searchMessage}>
                                    Buscando coincidencias...
                                </div>
                            )}

                            {!loading && searchError && (
                                <div
                                    className={`${styles.searchMessage} ${styles.searchError}`}
                                >
                                    No se ha podido realizar la búsqueda.
                                    Inténtalo de nuevo.
                                </div>
                            )}

                            {!loading &&
                                !searchError &&
                                hasSearched &&
                                results.length === 0 && (
                                    <div
                                        className={
                                            styles.searchMessage
                                        }
                                    >
                                        <strong>
                                            No hay resultados
                                        </strong>
                                        <p>
                                            Prueba con otro nombre o
                                            término de búsqueda.
                                        </p>
                                    </div>
                                )}

                            {!loading &&
                                !searchError &&
                                groupedResults.map((group) => (
                                    <section
                                        className={styles.resultGroup}
                                        key={group.type}
                                    >
                                        <h2
                                            className={
                                                styles.resultGroupTitle
                                            }
                                        >
                                            {group.type}
                                            <span>
                                                {group.items.length}
                                            </span>
                                        </h2>

                                        <ul
                                            className={
                                                styles.resultList
                                            }
                                        >
                                            {group.items.map(
                                                (result) => {
                                                    const resultIndex =
                                                        results.findIndex(
                                                            (item) =>
                                                                item.id ===
                                                                result.id &&
                                                                item.type ===
                                                                result.type,
                                                        );

                                                    return (
                                                        <li
                                                            key={`${result.type}-${result.id}`}
                                                        >
                                                            <Link
                                                                href={
                                                                    result.href
                                                                }
                                                                className={`${styles.resultItem} ${activeIndex ===
                                                                        resultIndex
                                                                        ? styles.resultItemActive
                                                                        : ""
                                                                    }`}
                                                                onMouseEnter={() =>
                                                                    setActiveIndex(
                                                                        resultIndex,
                                                                    )
                                                                }
                                                                onClick={
                                                                    closeSearch
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.resultItemText
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles.resultItemTitle
                                                                        }
                                                                    >
                                                                        {
                                                                            result.title
                                                                        }
                                                                    </span>

                                                                    {result.description && (
                                                                        <span
                                                                            className={
                                                                                styles.resultItemDescription
                                                                            }
                                                                        >
                                                                            {
                                                                                result.description
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </span>

                                                                <ArrowRight
                                                                    size={
                                                                        17
                                                                    }
                                                                    className={
                                                                        styles.resultArrow
                                                                    }
                                                                    aria-hidden="true"
                                                                />
                                                            </Link>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ul>
                                    </section>
                                ))}
                        </div>

                        <div className={styles.searchPanelFooter}>
                            <span>
                                <kbd>↑</kbd> <kbd>↓</kbd> para navegar
                            </span>
                            <span>
                                <kbd>Esc</kbd> para cerrar
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {menuOpen && (
                <nav
                    id="mobile-navigation"
                    className={styles.mobileNav}
                    aria-label="Navegación móvil"
                >
                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                    >
                        Inicio
                    </Link>

                    {links.map((link) => (
                        <Link
                            href={link.href}
                            key={link.href}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <Link
                        href="/acceso"
                        onClick={() => setMenuOpen(false)}
                    >
                        Iniciar sesión
                    </Link>

                    <Link
                        href="/inscripcion"
                        className={styles.mobileRegister}
                        onClick={() => setMenuOpen(false)}
                    >
                        Inscripciones
                    </Link>
                </nav>
            )}
        </header>
    );
}