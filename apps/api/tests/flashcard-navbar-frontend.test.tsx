// @ts-expect-error React is resolved from the web workspace for this SSR test.
import { createElement } from "../../web/node_modules/react/index.js";
// @ts-expect-error React DOM is resolved from the web workspace for this SSR test.
import { renderToStaticMarkup } from "../../web/node_modules/react-dom/server.js";
import { MemoryRouter } from "../../web/node_modules/react-router/dist/development/index.js";
import { describe, expect, it } from "vitest";
import Navbar from "../../web/src/components/Navbar.js";
import { AuthContext } from "../../web/src/contexts/auth-context.js";

function renderNavbar(role: "ADMIN" | "USER" | null, pathname = "/") {
  return renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      {
        value: {
          user: role
            ? {
                id: 1,
                displayName: "Yume User",
                email: "user@example.com",
                role,
              }
            : null,
          isLoading: false,
          refreshUser: async () => {},
          logout: async () => {},
        },
      },
      createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        createElement(Navbar),
      ),
    ),
  );
}

describe("Flashcard navigation", () => {
  it.each(["ADMIN", "USER"] as const)(
    "shows the Flashcard link to authenticated %s users",
    (role) => {
      const markup = renderNavbar(role);

      expect(markup).toContain('href="/flashcards"');
      expect(markup).toContain("Flashcard");
    },
  );

  it("does not show the Flashcard link to guests", () => {
    expect(renderNavbar(null)).not.toContain('href="/flashcards"');
  });

  it("marks the deck list link active", () => {
    expect(renderNavbar("USER", "/flashcards")).toMatch(
      /class="active" href="\/flashcards"/,
    );
  });
});
