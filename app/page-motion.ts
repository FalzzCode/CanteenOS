type MotionDelayProperty =
  | "--page-motion-delay"
  | "--page-motion-card-delay"
  | "--page-motion-child-delay"
  | "--page-motion-row-delay"
  | "--page-motion-micro-delay"
  | "--page-motion-shell-delay"
  | "--page-motion-sidebar-delay"
  | "--page-motion-section-delay"
  | "--page-motion-nav-delay"
  | "--page-motion-skeleton-delay";

const managedClasses = [
  "page-motion-managed",
  "page-motion-item",
  "page-motion-card",
  "page-motion-child",
  "page-motion-row",
  "page-motion-micro",
  "page-motion-shell",
  "page-motion-shell-part",
  "page-motion-sidebar",
  "page-motion-sidebar-brand",
  "page-motion-sidebar-label",
  "page-motion-sidebar-section",
  "page-motion-sidebar-nav-item",
  "page-motion-sidebar-part",
  "page-motion-nav-item",
  "page-motion-skeleton",
  "page-motion-hero-image",
] as const;

const managedStyleProperties: MotionDelayProperty[] = [
  "--page-motion-delay",
  "--page-motion-card-delay",
  "--page-motion-child-delay",
  "--page-motion-row-delay",
  "--page-motion-micro-delay",
  "--page-motion-shell-delay",
  "--page-motion-sidebar-delay",
  "--page-motion-section-delay",
  "--page-motion-nav-delay",
  "--page-motion-skeleton-delay",
];

const isMotionCandidate = (element: Element) => {
  const node = element as HTMLElement;
  const isPlaceholder = node.matches(".skeleton-block, .shell-loading-block, .customer-skeleton-block");
  return !node.hidden
    && node.tagName !== "OPTION"
    && node.tagName !== "SCRIPT"
    && node.tagName !== "STYLE"
    && !node.classList.contains("sr-only")
    && (node.getAttribute("aria-hidden") !== "true" || isPlaceholder);
};

const mark = (element: Element | null | undefined, className: (typeof managedClasses)[number], property?: MotionDelayProperty, delay = 0) => {
  if (!element) return;
  const node = element as HTMLElement;
  if (!isMotionCandidate(node)) return;
  node.classList.add("page-motion-managed", className);
  node.dataset.pageMotionManaged = "true";
  if (property) node.style.setProperty(property, `${Math.max(0, delay)}ms`);
};

const readMotionDelay = (element: Element | null) => {
  let current = element as HTMLElement | null;
  while (current) {
    for (const property of managedStyleProperties) {
      const value = current.style.getPropertyValue(property).trim();
      if (!value) continue;
      const delay = Number.parseFloat(value);
      if (Number.isFinite(delay)) return delay;
    }
    current = current.parentElement;
  }
  return 0;
};

const clearMotion = (root: ParentNode) => {
  const nodes: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.dataset.pageMotionManaged === "true") nodes.push(root);
  root.querySelectorAll<HTMLElement>("[data-page-motion-managed]").forEach((node) => nodes.push(node));
  nodes.forEach((node) => {
    node.classList.remove(...managedClasses);
    managedStyleProperties.forEach((property) => node.style.removeProperty(property));
    delete node.dataset.pageMotionManaged;
  });
};

const directChildren = (parent: Element | null, visualOrder = false) => {
  if (!parent) return [] as HTMLElement[];
  const children = Array.from(parent.children).filter((child) => isMotionCandidate(child)) as HTMLElement[];
  if (!visualOrder || typeof window === "undefined") return children;
  return children
    .map((element, index) => ({ element, index, order: Number.parseInt(window.getComputedStyle(element).order, 10) || 0 }))
    .sort((left, right) => left.order - right.order || left.index - right.index)
    .map(({ element }) => element);
};

const addDirectSequence = (
  parent: Element | null,
  className: (typeof managedClasses)[number],
  property: MotionDelayProperty,
  initialDelay: number,
  step: number,
  limit = 12,
  visualOrder = false,
) => {
  directChildren(parent, visualOrder).slice(0, limit).forEach((element, index) => {
    if (element.classList.contains("page-motion-item") && className !== "page-motion-item") return;
    if (
      className === "page-motion-micro"
      && (element.classList.contains("page-motion-card") || element.classList.contains("page-motion-row"))
    ) return;
    mark(element, className, property, initialDelay + index * step);
  });
};

const addSequence = (
  root: ParentNode,
  selector: string,
  className: (typeof managedClasses)[number],
  property: MotionDelayProperty,
  initialDelay: number,
  step: number,
  limit = 18,
) => {
  Array.from(root.querySelectorAll<HTMLElement>(selector))
    .filter((element) => isMotionCandidate(element) && !element.classList.contains("page-motion-item"))
    .slice(0, limit)
    .forEach((element, index) => mark(element, className, property, initialDelay + index * step));
};

const addGroupChildren = (
  root: ParentNode,
  selector: string,
  initialDelay: number,
  step: number,
  limit = 10,
) => {
  Array.from(root.querySelectorAll<HTMLElement>(selector)).forEach((group) => {
    const parentDelay = readMotionDelay(group);
    const localStart = Math.max(initialDelay, parentDelay + 78);
    addDirectSequence(group, "page-motion-micro", "--page-motion-micro-delay", localStart, step, limit);
  });
};

const findDirectChild = (parent: Element, className: string) =>
  Array.from(parent.children).find((child) => child.classList.contains(className)) as HTMLElement | undefined;

const adminCardSelector = [
  ".card",
  ".stat-card",
  ".management-stat-card",
  ".sales-card",
  ".ratio-card",
  ".alert-card",
  ".top-product-card",
  ".module-card",
  ".module-stat",
  ".detail-card",
  ".panel",
].join(", ");

const adminRowSelector = [
  ".data-table tbody > tr",
  ".module-table tbody > tr",
  ".activity-feed > *",
  ".alert-list > *",
  ".product-ranking > *",
  ".timeline-list > *",
  ".audit-list > *",
  ".transaction-mobile-list > *",
  ".purchase-list > *",
  ".movement-list > *",
  ".user-list > *",
  ".permission-grid > *",
  ".report-bars > *",
  ".module-pagination-pages > *",
  ".management-action-grid > *",
  ".management-product-list > *",
  ".management-followup-grid > *",
  ".detail-list > *",
].join(", ");

const adminMicroGroupSelector = [
  ".dashboard-command-copy",
  ".dashboard-command-bar",
  ".dashboard-command-actions",
  ".dashboard-command-actions > button",
  ".card",
  ".stat-card",
  ".stat-topline",
  ".stat-foot",
  ".card-heading",
  ".card-heading > div",
  ".module-stack",
  ".module-stat-grid",
  ".module-stat",
  ".module-toolbar",
  ".module-search",
  ".module-select",
  ".module-actions",
  ".module-input",
  ".transaction-mobile-card",
  ".transaction-mobile-head",
  ".transaction-mobile-id",
  ".transaction-mobile-items",
  ".transaction-mobile-meta",
  ".transaction-mobile-meta > div",
  ".table-scroll",
  ".module-table thead > tr",
  ".module-table tbody > tr > td",
  ".module-empty",
  ".module-notice",
  ".module-pagination",
  ".module-pagination-summary",
  ".module-pagination-pages",
  ".purchase-list",
  ".purchase-card",
  ".purchase-card-top",
  ".purchase-card-bottom",
  ".purchase-detail",
  ".movement-list",
  ".movement-row",
  ".report-layout",
  ".report-mix-content",
  ".report-mix-list",
  ".report-mix-row",
  ".report-bars",
  ".report-bar-column",
  ".report-highlight",
  ".range-switcher",
  ".admin-layout",
  ".cash-layout",
  ".shift-summary-grid",
  ".user-list",
  ".user-row",
  ".user-info",
  ".permission-grid",
  ".product-composer",
  ".product-composer > label",
  ".module-grid-two",
  ".reorder-draft",
  ".reorder-number",
  ".module-pagination-ellipsis",
  ".sales-summary-row",
  ".sales-summary-row > div",
  ".ratio-content",
  ".ratio-list",
  ".ratio-row",
  ".ratio-row-top",
  ".ratio-note",
  ".alert-list",
  ".alert-row",
  ".alert-row > span",
  ".product-ranking",
  ".ranking-row",
  ".ranking-name",
  ".activity-feed",
  ".activity-item",
  ".activity-main",
  ".activity-id-row",
  ".activity-meta",
  ".activity-total",
  ".activity-footer",
  ".chart-wrap",
  ".line-chart-shell",
  ".chart-legend",
  ".module-header",
  ".module-toolbar",
  ".module-card-heading",
  ".module-card-body",
  ".management-overview-copy",
  ".management-overview-actions",
  ".management-card-heading",
  ".management-stat-card",
  ".management-stat-topline",
  ".management-action",
  ".management-action-copy",
  ".management-product-row",
  ".management-product-copy",
  ".management-followup-action",
  ".management-followup-heading",
  ".management-live-note",
  ".management-product-art",
  ".management-stock-badge",
  ".management-card-footer-link",
  ".form-card-header",
  ".form-card-body",
  ".form-section",
  ".form-grid",
  ".form-field",
  ".form-actions",
  ".profile-current-top",
  ".profile-schedule-grid",
  ".profile-schedule-item",
  ".profile-guidance-card",
  ".profile-access-list",
  ".archive-summary-card",
  ".archive-guidance",
  ".archive-toolbar",
  ".archive-record",
  ".detail-card-header",
  ".detail-card-body",
  ".metric-list",
  ".data-table thead > tr",
  ".data-table tbody > tr > td",
  ".side-nav .nav-item",
  ".support-card",
  ".logout-button",
].join(", ");

const customerCardSelector = [
  ".customer-app-product-card",
  ".customer-app-offer-card",
  ".customer-profile-stat",
  ".customer-app-order-item",
  ".customer-app-home-action",
  ".customer-app-home-reorder-card",
].join(", ");

const customerRowSelector = [
  ".customer-app-history-list > article",
  ".customer-app-progress > *",
  ".customer-app-notification-list > button",
].join(", ");

const customerMicroGroupSelector = [
  ".customer-app-intro-motion > div:not(.customer-app-intro-art)",
  ".customer-app-intro-art",
  ".customer-app-service-pill",
  ".customer-app-search-row",
  ".customer-app-search-row label",
  ".customer-app-hero",
  ".customer-app-hero-copy",
  ".customer-app-hero-copy h2",
  ".customer-app-hero-controls",
  ".customer-app-hero-dots",
  ".customer-app-home-utility",
  ".customer-app-home-status-card",
  ".customer-app-home-status-copy",
  ".customer-app-home-status-metrics",
  ".customer-app-home-actions",
  ".customer-app-home-action",
  ".customer-app-section-heading",
  ".customer-app-section-heading > div",
  ".customer-app-categories",
  ".customer-app-category-scroller",
  ".customer-app-category",
  ".customer-app-popular",
  ".customer-app-popular-grid",
  ".customer-app-menu-grid",
  ".customer-app-product-card",
  ".customer-app-product-media",
  ".customer-app-product-copy",
  ".customer-app-product-footer",
  ".customer-app-offer-banner",
  ".customer-app-offer-banner > div",
  ".customer-app-offer-art",
  ".customer-app-offer-sticker",
  ".customer-app-page-heading",
  ".customer-app-page-heading > div",
  ".customer-app-menu-count",
  ".customer-app-order-count",
  ".customer-app-active-order",
  ".customer-app-active-order-head",
  ".customer-app-active-order-head > div",
  ".customer-app-progress",
  ".customer-app-progress-step",
  ".customer-app-active-order-insight",
  ".customer-app-active-order-footer",
  ".customer-app-order-layout",
  ".customer-app-order-card",
  ".customer-app-checkout-card",
  ".customer-app-checkout-total",
  ".customer-app-card-heading",
  ".customer-app-card-heading > div",
  ".customer-app-order-items",
  ".customer-app-order-item",
  ".customer-app-quantity",
  ".customer-app-empty-order",
  ".customer-app-history-panel",
  ".customer-app-history-list",
  ".customer-app-history-list > article",
  ".customer-app-home-reorder",
  ".customer-app-home-reorder > .customer-app-section-heading",
  ".customer-app-home-reorder-list",
  ".customer-app-home-reorder-card",
  ".customer-app-home-reorder-copy",
  ".customer-app-home-cart-bar",
  ".customer-app-offer-grid",
  ".customer-app-offer-card",
  ".customer-app-offer-card > div",
  ".customer-app-offer-note",
  ".customer-app-offer-note > div",
  ".customer-profile-hero",
  ".customer-profile-cover",
  ".customer-profile-cover-brand",
  ".customer-profile-avatar-stage",
  ".customer-profile-identity",
  ".customer-profile-identity-copy",
  ".customer-profile-identity-actions",
  ".customer-profile-quick-actions",
  ".customer-profile-stats",
  ".customer-profile-stat",
  ".customer-profile-stat-copy",
  ".customer-profile-stat-action",
  ".customer-profile-preferences",
  ".customer-profile-preferences > header",
  ".customer-profile-settings-list",
  ".customer-profile-setting-row",
  ".customer-profile-setting-copy",
  ".customer-app-notification-panel",
  ".customer-app-menu-drawer",
  ".customer-app-menu-drawer-header",
  ".customer-app-menu-drawer-items",
  ".customer-app-menu-drawer-items > button",
  ".customer-app-menu-copy",
  ".customer-app-menu-footer",
].join(", ");

const applyAdminShellMotion = (shell: HTMLElement, loading: boolean) => {
  const sidebar = shell.querySelector<HTMLElement>(".sidebar");
  const topbar = shell.querySelector<HTMLElement>(".topbar");
  const mobileNav = shell.querySelector<HTMLElement>(".mobile-bottom-nav");
  [sidebar, topbar, mobileNav].forEach((target) => target && clearMotion(target));

  // Keep the mounted shell stable while the in-flow route skeleton loads.
  // Replaying the shell animation here makes the real navigation fade under
  // the placeholder and reads like a second skeleton layer.
  if (loading) return;

  if (sidebar) {
    mark(sidebar, "page-motion-sidebar");
    mark(sidebar.querySelector(".sidebar-brand"), "page-motion-sidebar-brand", "--page-motion-sidebar-delay", 45);
    mark(sidebar.querySelector(".sidebar-profile"), "page-motion-sidebar-part", "--page-motion-sidebar-delay", 82);
    mark(sidebar.querySelector(".side-nav"), "page-motion-sidebar-part", "--page-motion-sidebar-delay", 108);
    mark(sidebar.querySelector(".sidebar-bottom"), "page-motion-sidebar-part", "--page-motion-sidebar-delay", 156);
    addSequence(sidebar, ".side-nav > .nav-section", "page-motion-sidebar-section", "--page-motion-section-delay", 115, 48, 8);
    addSequence(sidebar, ".side-nav > .nav-section > .nav-section-label", "page-motion-sidebar-label", "--page-motion-sidebar-delay", 128, 48, 8);
    addSequence(sidebar, ".side-nav .nav-item", "page-motion-sidebar-nav-item", "--page-motion-nav-delay", 145, 30, 24);
    addSequence(sidebar, ".sidebar-bottom > *", "page-motion-sidebar-part", "--page-motion-sidebar-delay", 180, 52, 8);
    addGroupChildren(sidebar, ".side-nav .nav-item, .support-card, .logout-button", 220, 18, 8);
  }

  if (topbar) {
    mark(topbar, "page-motion-shell");
    // Floating topbar panels use `position: fixed`. Do not animate their
    // containing wrappers: an identity transform still creates a containing
    // block and collapses the panel to the wrapper's narrow width on mobile.
    directChildren(topbar)
      .filter((element) => !element.matches(".topbar-actions"))
      .forEach((element, index) => mark(element, "page-motion-shell-part", "--page-motion-shell-delay", 70 + index * 45));
    addSequence(
      topbar,
      ".topbar-actions > :not(.top-profile-wrap), .topbar-actions > .top-profile-wrap > .top-profile",
      "page-motion-micro",
      "--page-motion-micro-delay",
      190,
      38,
      8,
    );
    addGroupChildren(topbar, ".breadcrumb, .admin-header-search, .outlet-select, .icon-button, .top-profile", 230, 18, 8);
  }

  if (mobileNav) {
    addSequence(mobileNav, ".mobile-bottom-nav-surface > button", "page-motion-nav-item", "--page-motion-nav-delay", 250, 35, 8);
    addGroupChildren(mobileNav, ".mobile-bottom-nav-surface > button", 330, 14, 4);
  }

  addSequence(
    shell,
    ".admin-shell-loading-overlay .shell-loading-block",
    "page-motion-skeleton",
    "--page-motion-skeleton-delay",
    25,
    32,
    80,
  );
};

const applyAdminRouteMotion = (routeView: HTMLElement, loading: boolean) => {
  clearMotion(routeView);
  const pageHeader = findDirectChild(routeView, "page-header");
  if (pageHeader) {
    mark(pageHeader, "page-motion-item", "--page-motion-delay", 0);
    addDirectSequence(pageHeader, "page-motion-micro", "--page-motion-micro-delay", 90, 36, 8);
    addGroupChildren(pageHeader, ".page-title-block, .page-actions, .page-context", 105, 26, 8);
  }

  const contentStateClass = loading ? "route-content-loading" : "route-content-ready";
  const contentState = Array.from(routeView.children).find((child) => child.classList.contains(contentStateClass)) as HTMLElement | undefined;
  if (!contentState) return;

  if (loading) {
    addSequence(contentState, ".skeleton-block, .shell-loading-block", "page-motion-skeleton", "--page-motion-skeleton-delay", 35, 30, 42);
    return;
  }

  const pageBody = contentState.firstElementChild as HTMLElement | null;
  if (pageBody) addDirectSequence(pageBody, "page-motion-item", "--page-motion-delay", 110, 55, 12, true);

  addSequence(contentState, adminCardSelector, "page-motion-card", "--page-motion-card-delay", 190, 36, 28);
  addSequence(contentState, adminRowSelector, "page-motion-row", "--page-motion-row-delay", 210, 28, 28);
  addGroupChildren(contentState, adminMicroGroupSelector, 260, 24, 8);
};

const applyCustomerShellMotion = (frame: HTMLElement, loading: boolean) => {
  const header = frame.querySelector<HTMLElement>(".customer-app-header");
  const desktopNav = frame.querySelector<HTMLElement>(".customer-app-desktop-nav");
  const bottomNav = frame.querySelector<HTMLElement>(".customer-app-bottom-nav");
  [header, desktopNav, bottomNav].forEach((target) => target && clearMotion(target));

  if (loading) return;

  if (header) {
    mark(header, "page-motion-shell");
    addDirectSequence(header, "page-motion-shell-part", "--page-motion-shell-delay", 70, 45, 8);
    addSequence(header, ".customer-app-header-actions > *", "page-motion-micro", "--page-motion-micro-delay", 190, 38, 6);
    addGroupChildren(header, ".customer-app-icon-button, .customer-app-brand, .customer-app-header-meta, .customer-app-header-actions, .customer-app-avatar-button", 230, 18, 8);
  }
  if (desktopNav) {
    addSequence(desktopNav, "button", "page-motion-nav-item", "--page-motion-nav-delay", 155, 48, 8);
    addGroupChildren(desktopNav, "button", 235, 16, 4);
  }
  if (bottomNav) {
    addSequence(bottomNav, "button", "page-motion-nav-item", "--page-motion-nav-delay", 250, 35, 8);
    addGroupChildren(bottomNav, "button", 330, 14, 4);
  }

  addSequence(
    frame,
    ".customer-shell-loading-overlay .shell-loading-block",
    "page-motion-skeleton",
    "--page-motion-skeleton-delay",
    25,
    32,
    80,
  );
};

const applyCustomerRouteMotion = (routeState: HTMLElement, loading: boolean) => {
  clearMotion(routeState);
  if (loading) {
    addSequence(routeState, ".customer-skeleton-block, .shell-loading-block", "page-motion-skeleton", "--page-motion-skeleton-delay", 35, 30, 48);
    return;
  }

  addDirectSequence(routeState, "page-motion-item", "--page-motion-delay", 0, 55, 14, true);
  addSequence(routeState, customerCardSelector, "page-motion-card", "--page-motion-card-delay", 160, 36, 30);
  addSequence(routeState, customerRowSelector, "page-motion-row", "--page-motion-row-delay", 185, 28, 24);
  addSequence(routeState, ".customer-app-hero > img.is-active", "page-motion-hero-image", "--page-motion-child-delay", 110, 0, 1);
  addGroupChildren(routeState, customerMicroGroupSelector, 150, 24, 8);
};

const applyAuthMotion = (screen: HTMLElement) => {
  clearMotion(screen);
  const formSide = screen.querySelector<HTMLElement>(".login-form-side");
  const art = screen.querySelector<HTMLElement>(".login-art");
  addDirectSequence(screen, "page-motion-item", "--page-motion-delay", 0, 90, 4, true);
  addDirectSequence(art, "page-motion-micro", "--page-motion-micro-delay", 90, 48, 6);
  addGroupChildren(screen, ".login-art, .login-art-brand, .login-art-copy, .login-art-visual, .login-art-visual-main, .login-art-footer", 175, 28, 8);

  if (formSide) {
    const formWrap = formSide.querySelector<HTMLElement>(".login-form-wrap");
    mark(formWrap, "page-motion-child", "--page-motion-child-delay", 75);
    addDirectSequence(formWrap, "page-motion-micro", "--page-motion-micro-delay", 115, 38, 16);
    addGroupChildren(formSide, ".login-form-wrap, .login-brand, .auth-context, .auth-role-switch, .auth-form, .login-note, .login-error, .login-success", 180, 28, 8);
    addSequence(formSide, ".auth-role-button, .auth-form > label, .auth-form > button, .forgot-button, .auth-switch-link", "page-motion-row", "--page-motion-row-delay", 235, 38, 18);
    addGroupChildren(formSide, ".auth-role-button, .google-button, .form-divider, .auth-form > label, .password-input, .auth-form > button, .forgot-button, .auth-switch-link, .auth-provision-note", 245, 20, 8);
  }
};

export const prepareAdminMotion = (shell: HTMLElement, routeView: HTMLElement, loading: boolean) => {
  applyAdminShellMotion(shell, loading);
  applyAdminRouteMotion(routeView, loading);
  return () => {
    [shell.querySelector<HTMLElement>(".sidebar"), shell.querySelector<HTMLElement>(".topbar"), shell.querySelector<HTMLElement>(".mobile-bottom-nav"), routeView]
      .forEach((target) => target && clearMotion(target));
  };
};

export const prepareCustomerMotion = (frame: HTMLElement, routeState: HTMLElement, loading: boolean) => {
  applyCustomerShellMotion(frame, loading);
  applyCustomerRouteMotion(routeState, loading);
  return () => {
    [frame.querySelector<HTMLElement>(".customer-app-header"), frame.querySelector<HTMLElement>(".customer-app-desktop-nav"), frame.querySelector<HTMLElement>(".customer-app-bottom-nav"), routeState]
      .forEach((target) => target && clearMotion(target));
  };
};

export const prepareAuthMotion = (screen: HTMLElement) => {
  applyAuthMotion(screen);
  return () => clearMotion(screen);
};
