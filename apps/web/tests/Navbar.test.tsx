import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "../../api/node_modules/vitest";
import Navbar from "../src/components/Navbar";
import { AuthContext } from "../src/contexts/auth-context";

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

describe("Navbar navigation by role", () => {
  it("shows direct administration links to ADMIN without a dropdown", () => {
    const markup = renderNavbar("ADMIN");

    expect(markup).not.toContain("admin-menu");
    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain('href="/admin/users"');
    expect(markup).toContain('href="/admin/grammar"');
    expect(markup).toContain("Tài khoản");
    expect(markup).toContain('href="/reading"');
    expect(markup).not.toContain("/forum");
  });

  it("marks admin grammar navigation active on all admin grammar routes", () => {
    const markup = renderNavbar("ADMIN", "/admin/grammar/42/edit");

    expect(markup).toMatch(/class="active" href="\/admin\/grammar"/);
  });

  it.each(["USER", null] as const)(
    "%s continues to use public grammar and sees no admin links",
    (role) => {
      const markup = renderNavbar(role);

      expect(markup).toContain('href="/grammar"');
      expect(markup).not.toContain("/admin/dashboard");
      expect(markup).not.toContain("/admin/users");
      expect(markup).not.toContain("/admin/grammar");
      expect(markup).not.toContain("/forum");
    },
  );

  it("keeps the guest registration and login actions", () => {
    const markup = renderNavbar(null);

    expect(markup).toContain('href="/register"');
    expect(markup).toContain('href="/login"');
  });

  it("provides a responsive navigation toggle", () => {
    const markup = renderNavbar("ADMIN");
    expect(markup).toContain('aria-controls="primary-navigation"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="primary-navigation"');
  });
});
