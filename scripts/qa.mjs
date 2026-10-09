import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());

const requiredFiles = [
    "src/app/layout.tsx",
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

    "src/app/(public)/page.tsx",
    "src/app/(public)/torneos/page.tsx",
    "src/app/(public)/torneos/page.module.css",
    "src/app/(public)/torneos/[slug]/page.tsx",
    "src/app/(public)/torneos/[slug]/page.module.css",

    "src/app/(public)/ranking/page.tsx",
    "src/app/(public)/ranking/page.module.css",

    "src/app/(public)/jugadores/page.tsx",
    "src/app/(public)/jugadores/page.module.css",
    "src/app/(public)/jugadores/[id]/page.tsx",
    "src/app/(public)/jugadores/[id]/page.module.css",

    "src/app/(public)/circuito/page.tsx",
    "src/app/(public)/circuito/page.module.css",
    "src/app/(public)/master-final/page.tsx",
    "src/app/(public)/master-final/page.module.css",

    "src/app/(public)/noticias/page.tsx",
    "src/app/(public)/noticias/page.module.css",
    "src/app/(public)/noticias/[slug]/page.tsx",
    "src/app/(public)/noticias/[slug]/page.module.css",

    "src/app/(public)/privacidad/page.tsx",
    "src/app/(public)/privacidad/page.module.css",
    "src/app/(public)/cookies/page.tsx",
    "src/app/(public)/cookies/page.module.css",
    "src/app/(public)/aviso-legal/page.tsx",
    "src/app/(public)/aviso-legal/page.module.css",
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

function hasRouteFile(relativePath) {
    return existsSync(join(root, relativePath));
}

function assertRouteContract(
    relativePath,
    requiredTerms,
    forbiddenTerms = [],
) {
    const content = readText(relativePath);

    if (content === null) {
        logError(
            `No se puede validar ${relativePath}: archivo inexistente`,
        );
        return;
    }

    for (const term of requiredTerms) {
        if (content.includes(term)) {
            logOk(
                `${relativePath}: contiene ${term}`,
            );
        } else {
            logError(
                `${relativePath}: falta ${term}`,
            );
        }
    }

    for (const term of forbiddenTerms) {
        if (content.includes(term)) {
            logError(
                `${relativePath}: contiene contenido incompatible: ${term}`,
            );
        }
    }
}

console.log("");
console.log("==========================================");
console.log(" SAGUNTO PADEL CUP — QA");
console.log("==========================================");
console.log("");

console.log("1. Estructura pública");

for (const relativePath of requiredFiles) {
    if (existsSync(join(root, relativePath))) {
        logOk(relativePath);
    } else {
        logError(`Falta ${relativePath}`);
    }
}

console.log("");

console.log("2. Contratos de rutas públicas");

assertRouteContract(
    "src/app/(public)/torneos/page.tsx",
    [
        "getPublicTournaments",
        "href={`/torneos/${tournament.slug}",
    ],
    [
        "getPublicTournamentBySlug",
        "params.slug",
    ],
);

assertRouteContract(
    "src/app/(public)/torneos/[slug]/page.tsx",
    [
        "getPublicTournamentBySlug",
        "params",
        "slug",
    ],
);

assertRouteContract(
    "src/app/(public)/noticias/page.tsx",
    [
        "getPublicNews",
        "href={`/noticias/${item.slug}",
    ],
    [
        "getPublicNewsBySlug",
        "params.slug",
    ],
);

assertRouteContract(
    "src/app/(public)/noticias/[slug]/page.tsx",
    [
        "getPublicNewsBySlug",
        "params",
        "slug",
    ],
);

assertRouteContract(
    "src/app/(public)/jugadores/page.tsx",
    [
        "getPublicPlayers",
        "href={`/jugadores/${player.id}",
    ],
    [
        "getPublicRanking",
        "searchParams",
    ],
);

assertRouteContract(
    "src/app/(public)/jugadores/[id]/page.tsx",
    [
        "getPublicPlayer",
        "params",
        "id",
    ],
);

console.log("");

console.log("3. Validators");

const validatorDirectory = join(
    root,
    "src",
    "lib",
    "validators",
);

if (!existsSync(validatorDirectory)) {
    logOk(
        "No hay una carpeta de validators separada; no se aplica una comprobación artificial",
    );
} else {
    const validatorFiles = [
        "auth.ts",
        "match.ts",
        "player.ts",
        "registration.ts",
        "tournament.ts",
    ];

    let validatorCount = 0;

    for (const file of validatorFiles) {
        const relativePath = join(
            "src/lib/validators",
            file,
        );
        const content = readText(relativePath);

        if (content === null) {
            continue;
        }

        validatorCount += 1;

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
            logOk(
                `${relativePath} no contiene reglas ajenas detectadas`,
            );
        }
    }

    if (validatorCount === 0) {
        logOk(
            "No hay una carpeta de validators separada; no se aplica una comprobación artificial",
        );
    }
}

console.log("");

console.log("4. Capa pública de datos");

const publicSite = readText(
    "src/lib/public/site.ts",
);

if (publicSite === null) {
    logError(
        "No existe src/lib/public/site.ts",
    );
} else {
    const requiredPublicFunctions = [
        "getPublicTournaments",
        "getPublicTournamentBySlug",
        "getPublicRanking",
        "getPublicPlayers",
        "getPublicPlayer",
        "getPublicNews",
        "getPublicNewsBySlug",
    ];

    for (const functionName of requiredPublicFunctions) {
        if (publicSite.includes(functionName)) {
            logOk(
                `site.ts contiene ${functionName}`,
            );
        } else {
            logWarning(
                `site.ts no contiene ${functionName}`,
            );
        }
    }
}

console.log("");

console.log("5. SEO y rastreo");

const robots = readText(
    "src/app/robots.ts",
);
const sitemap = readText(
    "src/app/sitemap.ts",
);
const seo = readText(
    "src/lib/public/seo.ts",
);

if (robots !== null) {
    logOk("robots.ts existe");

    for (const path of [
        "/admin",
        "/api",
        "/app",
        "/login",
        "/registro",
    ]) {
        if (robots.includes(path)) {
            logOk(
                `robots.ts bloquea ${path}`,
            );
        } else {
            logWarning(
                `robots.ts no bloquea explícitamente ${path}`,
            );
        }
    }
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
            logOk(
                `SEO contempla ${property}`,
            );
        } else {
            logWarning(
                `SEO no contiene explícitamente ${property}`,
            );
        }
    }
} else {
    logError(
        "No existe src/lib/public/seo.ts",
    );
}

console.log("");

console.log("6. Estados de aplicación");

for (const relativePath of [
    "src/app/loading.tsx",
    "src/app/error.tsx",
    "src/app/not-found.tsx",
]) {
    if (hasRouteFile(relativePath)) {
        logOk(
            `${relativePath} existe`,
        );
    } else {
        logError(
            `No existe ${relativePath}`,
        );
    }
}

console.log("");

console.log("7. Scripts y dependencias");

const packagePath = join(
    root,
    "package.json",
);

if (!existsSync(packagePath)) {
    logError("No existe package.json");
} else {
    const packageJson = JSON.parse(
        readFileSync(
            packagePath,
            "utf8",
        ),
    );

    const scripts =
        packageJson.scripts ?? {};

    for (const script of [
        "dev",
        "build",
        "start",
        "lint",
        "qa",
        "test",
        "typecheck",
    ]) {
        if (scripts[script]) {
            logOk(
                `Existe npm run ${script}`,
            );
        } else {
            logWarning(
                `No existe script ${script}`,
            );
        }
    }

    if (
        existsSync(
            join(
                root,
                "package-lock.json",
            ),
        )
    ) {
        logOk(
            "package-lock.json existe y queda versionado",
        );
    } else {
        logError(
            "Falta package-lock.json",
        );
    }
}

console.log("");

console.log(
    "8. Archivos locales que no deben entrar en Git",
);

const gitignore = readText(
    ".gitignore",
);

if (
    gitignore?.includes(
        "/supabase/.temp/",
    )
) {
    logOk(
        ".gitignore excluye supabase/.temp",
    );
} else {
    logError(
        ".gitignore no excluye supabase/.temp",
    );
}

console.log("");

console.log("9. Lint");

if (
    existsSync(
        join(root, "node_modules"),
    )
) {
    const packageJson = JSON.parse(
        readFileSync(
            packagePath,
            "utf8",
        ),
    );

    if (packageJson.scripts?.lint) {
        const lintResult = spawnSync(
            process.platform === "win32"
                ? "npm.cmd"
                : "npm",
            ["run", "lint"],
            {
                cwd: root,
                stdio: "inherit",
                shell:
                    process.platform ===
                    "win32",
            },
        );

        if (lintResult.status === 0) {
            logOk("npm run lint");
        } else {
            logError(
                "npm run lint ha fallado",
            );
        }
    }
} else {
    logWarning(
        "node_modules no existe; se omite ejecución de lint en este entorno",
    );
}

console.log("");

console.log("10. TypeScript");

if (
    existsSync(
        join(root, "node_modules"),
    )
) {
    const tscResult = spawnSync(
        process.platform === "win32"
            ? "npx.cmd"
            : "npx",
        [
            "tsc",
            "--noEmit",
            "--incremental",
            "false",
        ],
        {
            cwd: root,
            stdio: "inherit",
            shell:
                process.platform ===
                "win32",
        },
    );

    if (tscResult.status === 0) {
        logOk(
            "TypeScript — tsc --noEmit",
        );
    } else {
        logError(
            "TypeScript — tsc --noEmit ha fallado",
        );
    }
} else {
    logWarning(
        "node_modules no existe; se omite TypeScript en este entorno",
    );
}

console.log("");

console.log("11. Tests");

if (
    existsSync(
        join(root, "node_modules"),
    )
) {
    const packageJson = JSON.parse(
        readFileSync(
            packagePath,
            "utf8",
        ),
    );

    if (packageJson.scripts?.test) {
        const testResult = spawnSync(
            process.platform === "win32"
                ? "npm.cmd"
                : "npm",
            ["run", "test"],
            {
                cwd: root,
                stdio: "inherit",
                shell:
                    process.platform ===
                    "win32",
            },
        );

        if (testResult.status === 0) {
            logOk("npm run test");
        } else {
            logError(
                "npm run test ha fallado",
            );
        }
    }
} else {
    logWarning(
        "node_modules no existe; se omiten los tests en este entorno",
    );
}

console.log("");

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
    console.warn(
        "QA COMPLETADO CON WARNINGS",
    );
    process.exit(0);
}

console.log(
    "QA COMPLETADO CORRECTAMENTE",
);
process.exit(0);