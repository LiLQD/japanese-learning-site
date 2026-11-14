import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "../../api/node_modules/vitest";
import Navbar from "../src/components/Navbar";
import { AuthContext } from "../src/contexts/auth-context";

function renderNavbar(role: "ADMIN" | "USER" | null) {
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
      createElement(MemoryRouter, null, createElement(Navbar)),
    ),
  );
}

describe("Navbar administration menu", () => {
  it("shows a closed administration dropdown to ADMIN", () => {
    const markup = renderNavbar("ADMIN");

    expect(markup).toContain("Quản trị");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("/admin/dashboard");
    expect(markup).not.toContain("/admin/users");
    expect(markup).not.toContain("/admin/grammar");
  });

  it.each(["USER", null] as const)(
    "hides administration navigation from %s",
    (role) => {
      const markup = renderNavbar(role);

      expect(markup).not.toContain("Quản trị");
      expect(markup).not.toContain("/admin/dashboard");
      expect(markup).not.toContain("/admin/users");
      expect(markup).not.toContain("/admin/grammar");
    },
  );

  it("keeps the primary home, vocabulary and grammar links together", () => {
    const markup = renderNavbar(null);

    expect(markup).toMatch(
      /<nav[^>]*>[\s\S]*href="\/"[^>]*>Trang chủ[\s\S]*href="\/words"[^>]*>Từ vựng[\s\S]*href="\/grammar"[^>]*>Ngữ pháp[\s\S]*<\/nav>/,
    );
  });
});
