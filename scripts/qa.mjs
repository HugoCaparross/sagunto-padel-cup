import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());

const requiredFiles = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/loading.tsx",
    "src/app/error.tsx",
    "src/app/not-found.tsx",
    "src/app/robots.ts",
    "src/app/sitemap.ts",

    "src/components/public/PublicShell.tsx",
    "src/components/public/PublicShell.module.css",
    "src/components/public/PublicBlocks.tsx",
    "src/components/public/PublicBlocks.module.css",

    "src/lib/public/site.ts",
    "src/lib/public/seo.ts",

    "src/app/torneos/page.tsx",
    "src/app/torneos/page.module.css",
    "src/app/torneos/[slug]/page.tsx",
    "src/app/torneos/[slug]/page.module.css",

    "src/app/ranking/page.tsx",
    "src/app/ranking/page.module.css",

    "src/app/jugadores/page.tsx",
    "src/app/jugadores/page.module.css",
    "src/app/jugadores/[id]/page.tsx",
    "src/app/jugadores/[id]/page.module.css",

    "src/app/circuito/page.tsx",
    "src/app/circuito/page.module.css",

    "src/app/master/page.tsx",
    "src/app/master/page.module.css",

    "src/app/noticias/page.tsx",
    "src/app/noticias/page.module.css",
    "src/app/noticias/[slug]/page.tsx",
    "src/app/noticias/[slug]/page.module.css",

    "src/app/galeria/page.tsx",
    "src/app/galeria/page.module.css",

    "src/app/privacidad/page.tsx",
    "src/app/privacidad/page.module.css",
    "src/app/cookies/page.tsx",
    "src/app/cookies/page.module.css",
    "src/app/aviso-legal/page.tsx",
    "src/app/aviso-legal/page.module.css",
];

const forbiddenValidatorTerms = [
    "Spain",
    "Latam",
    "Spain / Latam",
    "España / Latam",
];

let errors = 0;
let warnings = 0;

function logOk(message) {
    console.log(`OK   ${message}`);
}

function logError(message) {
    console.error(`ERROR ${message}`);
    errors += 1;
}

function logWarning(message) {
    console.warn(`WARN ${message}`);
    warnings += 1;
}

function readText(relativePath) {
    const absolutePath = join(root, relativePath);

    if (!existsSync(absolutePath)) {
        return null;
    }

    return readFileSync(absolutePath, "utf8");
}

console.log("");
console.log("==========================================");
console.log(" SAGUNTO PADEL CUP — QA");
console.log("==========================================");
console.log("");

/**
 * 1. Archivos públicos obligatorios
 */
console.log("1. Estructura pública");

for (const relativePath of requiredFiles) {
    if (existsSync(join(root, relativePath))) {
        logOk(relativePath);
    } else {
        logError(`Falta ${relativePath}`);
    }
}

console.log("");

/**
 * 2. Comprobación de validators
 *
 * Este QA no impone reglas deportivas nuevas.
 * Únicamente evita que entren accidentalmente reglas
 * ajenas al proyecto.
 */
console.log("2. Validators");

const validatorDirectory = join(root, "src", "lib", "validators");

if (!existsSync(validatorDirectory)) {
    logWarning("No existe src/lib/validators. No se realiza comprobación de validators.");
} else {
    const validatorFiles = [
        "auth.ts",
        "match.ts",
        "player.ts",
        "registration.ts",
        "tournament.ts",
    ];

    for (const file of validatorFiles) {
        const relativePath = join("src/lib/validators", file);
        const content = readText(relativePath);

        if (content === null) {
            logWarning(`No existe ${relativePath}`);
            continue;
        }

        let fileHasForbiddenTerm = false;

        for (const term of forbiddenValidatorTerms) {
            if (content.includes(term)) {
                logError(
                    `${relativePath} contiene una regla no perteneciente a Sagunto Padel Cup: "${term}"`,
                );
                fileHasForbiddenTerm = true;
            }
        }

        if (!fileHasForbiddenTerm) {
            logOk(`${relativePath} no contiene reglas ajenas detectadas`);
        }
    }
}

console.log("");

/**
 * 3. Capa pública de datos
 */
console.log("3. Capa pública de datos");

const publicSite = readText("src/lib/public/site.ts");

if (publicSite === null) {
    logError("No existe src/lib/public/site.ts");
} else {
    const requiredPublicFunctions = [
        "getPublicHomeData",
        "getPublicTournaments",
        "getPublicTournamentBySlug",
        "getPublicRanking",
        "getPublicPlayers",
        "getPublicPlayer",
        "getPublicNews",
        "getPublicNewsBySlug",
        "getPublicGallery",
    ];

    for (const functionName of requiredPublicFunctions) {
        if (publicSite.includes(functionName)) {
            logOk(`site.ts contiene ${functionName}`);
        } else {
            logWarning(`site.ts no contiene ${functionName}`);
        }
    }

    if (
        publicSite.includes(".from(") ||
        publicSite.includes("supabase")
    ) {
        logOk("site.ts contiene acceso a datos");
    } else {
        logWarning(
            "No se ha detectado acceso evidente a Supabase en site.ts",
        );
    }
}

console.log("");

/**
 * 4. Noticias publicadas
 */
console.log("4. Noticias públicas");

const newsPage = readText("src/app/noticias/page.tsx");
const newsDetailPage = readText("src/app/noticias/[slug]/page.tsx");

if (newsPage?.includes("publicado")) {
    logOk("Listado de noticias contempla estado publicado");
} else {
    logWarning(
        "No se ha detectado explícitamente el filtro de noticias publicadas",
    );
}

if (newsDetailPage?.includes("notFound")) {
    logOk("Detalle de noticia contempla contenido inexistente");
} else {
    logWarning(
        "No se ha detectado notFound() en el detalle de noticias",
    );
}

console.log("");

/**
 * 5. Galería publicada
 */
console.log("5. Galería pública");

const galleryPage = readText("src/app/galeria/page.tsx");

if (galleryPage?.includes("published")) {
    logOk("Galería contempla contenido publicado");
} else {
    logWarning(
        "No se ha detectado explícitamente el filtro published",
    );
}

console.log("");

/**
 * 6. SEO
 */
console.log("6. SEO");

const robots = readText("src/app/robots.ts");
const sitemap = readText("src/app/sitemap.ts");
const seo = readText("src/lib/public/seo.ts");

if (robots !== null) {
    logOk("robots.ts existe");
} else {
    logError("No existe robots.ts");
}

if (sitemap !== null) {
    logOk("sitemap.ts existe");
} else {
    logError("No existe sitemap.ts");
}

if (seo !== null) {
    logOk("Capa SEO existe");

    for (const property of [
        "title",
        "description",
        "openGraph",
    ]) {
        if (seo.includes(property)) {
            logOk(`SEO contempla ${property}`);
        } else {
            logWarning(`SEO no contiene explícitamente ${property}`);
        }
    }
} else {
    logError("No existe src/lib/public/seo.ts");
}

console.log("");

/**
 * 7. Estados básicos
 */
console.log("7. Estados de aplicación");

const loading = readText("src/app/loading.tsx");
const errorPage = readText("src/app/error.tsx");
const notFound = readText("src/app/not-found.tsx");

if (loading !== null) {
    logOk("loading.tsx existe");
} else {
    logError("No existe loading.tsx");
}

if (errorPage !== null) {
    logOk("error.tsx existe");
} else {
    logError("No existe error.tsx");
}

if (notFound !== null) {
    logOk("not-found.tsx existe");
} else {
    logError("No existe not-found.tsx");
}

console.log("");

/**
 * 8. package.json
 */
console.log("8. Scripts del proyecto");

const packagePath = join(root, "package.json");

if (!existsSync(packagePath)) {
    logError("No existe package.json");
} else {
    const packageJson = JSON.parse(
        readFileSync(packagePath, "utf8"),
    );

    const scripts = packageJson.scripts ?? {};

    if (scripts.lint) {
        logOk("Existe npm run lint");
    } else {
        logWarning("No existe script lint");
    }

    if (scripts.build) {
        logOk("Existe npm run build");
    } else {
        logWarning("No existe script build");
    }
}

console.log("");

/**
 * 9. Lint
 *
 * Se ejecuta únicamente si existe el script.
 */
console.log("9. Lint");

const packageJson = JSON.parse(
    readFileSync(packagePath, "utf8"),
);

if (packageJson.scripts?.lint) {
    const lintResult = spawnSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "lint"],
        {
            cwd: root,
            stdio: "inherit",
        },
    );

    if (lintResult.status === 0) {
        logOk("npm run lint");
    } else {
        logError("npm run lint ha fallado");
    }
} else {
    logWarning("No se puede ejecutar lint porque no existe el script");
}

console.log("");

/**
 * 10. TypeScript
 */
console.log("10. TypeScript");

const tscResult = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsc", "--noEmit"],
    {
        cwd: root,
        stdio: "inherit",
    },
);

if (tscResult.status === 0) {
    logOk("TypeScript — tsc --noEmit");
} else {
    logError("TypeScript — tsc --noEmit ha fallado");
}

console.log("");

/**
 * Resultado final
 */
console.log("==========================================");
console.log(" RESULTADO QA");
console.log("==========================================");
console.log("");

console.log(`Errores: ${errors}`);
console.log(`Warnings: ${warnings}`);

console.log("");

if (errors > 0) {
    console.error("QA FALLIDO");
    process.exit(1);
}

if (warnings > 0) {
    console.warn("QA COMPLETADO CON WARNINGS");
    process.exit(0);
}

console.log("QA COMPLETADO CORRECTAMENTE");
process.exit(0);