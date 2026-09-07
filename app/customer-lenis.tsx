"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type CustomerScrollTargetDetail = {
  target?: string;
  offset?: number;
};

const customerScrollRevealSelector = [
  ".customer-app-home-layout > form.customer-app-search-row",
  ".customer-app-home-layout > section",
  ".customer-app-page > .customer-app-page-heading",
  ".customer-app-page > .customer-app-search-row",
  ".customer-app-page > .customer-app-menu-filter-panel",
  ".customer-app-page > .customer-app-menu-grid",
  ".customer-app-page > .customer-app-empty-state",
  ".customer-app-page > .customer-app-order-layout",
  ".customer-app-page > .customer-app-history-panel",
  ".customer-app-page > .customer-app-offer-grid",
  ".customer-app-page > .customer-app-offer-note",
  ".customer-profile-page > .customer-profile-hero",
  ".customer-profile-page > .customer-profile-quick-actions",
  ".customer-profile-page > .customer-profile-stats",
  ".customer-profile-page > .customer-profile-preferences",
].join(", ");

/**
 * Customer-only smooth scrolling. The admin workspace deliberately does not
 * mount this component because tables, filters, and operational controls need
 * native scroll semantics.
 */
export function CustomerLenisScroll() {
  useEffect(() => {
    const customerRoot = document.querySelector<HTMLElement>(".customer-portal.customer-app");
    if (!customerRoot) return;

    const header = customerRoot.querySelector<HTMLElement>(".customer-app-header");
    let frame = 0;
    let mutationFrame = 0;
    let latestProgress = 0;
    let latestIsScrolling = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }).connection;
    const lowPowerDevice = (
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
      || (typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number"
        && (navigator as Navigator & { deviceMemory?: number }).deviceMemory <= 4)
      || connection?.saveData === true
      || connection?.effectiveType === "slow-2g"
      || connection?.effectiveType === "2g"
    );
    const progressThreshold = lowPowerDevice ? 0.002 : 0.001;
    customerRoot.dataset.customerPerformance = lowPowerDevice ? "lite" : "full";

    const revealObserver = prefersReducedMotion ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-customer-scroll-revealed");
        revealObserver?.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    const registerScrollRevealTargets = () => {
      let revealSequence = 0;
      customerRoot.querySelectorAll<HTMLElement>(customerScrollRevealSelector).forEach((target) => {
        if (target.dataset.customerScrollRevealBound === "true") return;
        target.dataset.customerScrollRevealBound = "true";
        target.style.setProperty(
          "--customer-scroll-reveal-delay",
          `${lowPowerDevice ? 0 : Math.min(revealSequence * 64, 220)}ms`,
        );
        revealSequence += 1;
        if (revealObserver) {
          revealObserver.observe(target);
        } else {
          target.classList.add("is-customer-scroll-revealed");
        }
      });
    };

    registerScrollRevealTargets();
    const content = customerRoot.querySelector<HTMLElement>(".customer-app-content");
    const routeObserver = content ? new MutationObserver(() => {
      if (mutationFrame) return;
      mutationFrame = window.requestAnimationFrame(() => {
        mutationFrame = 0;
        registerScrollRevealTargets();
      });
    }) : null;
    if (content && routeObserver) routeObserver.observe(content, { childList: true, subtree: true });

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: lowPowerDevice ? 0.16 : 0.12,
      wheelMultiplier: 0.9,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node) => Boolean(node.closest("[data-lenis-prevent]")),
    });

    const resetCustomerScroll = () => {
      lenis.scrollTo(0, { immediate: true, force: true });
    };
    const scrollToCustomerTarget = (event: Event) => {
      const detail = (event as CustomEvent<CustomerScrollTargetDetail>).detail;
      if (!detail?.target) return;

      const target = customerRoot.querySelector<HTMLElement>(detail.target);
      if (!target) return;

      lenis.scrollTo(target, {
        offset: detail.offset ?? -18,
        force: true,
        lerp: lowPowerDevice ? 0.22 : 0.16,
      });
    };
    window.addEventListener("customer-scroll-to-top", resetCustomerScroll);
    window.addEventListener("customer-scroll-to-target", scrollToCustomerTarget);

    const syncScrollVisuals = (instance: Lenis) => {
      const limit = Math.max(1, instance.limit);
      const progress = clamp(instance.scroll / limit, 0, 1);
      const isScrolling = Boolean(instance.isScrolling) || Math.abs(instance.velocity) > 0.02;
      if (Math.abs(progress - latestProgress) < progressThreshold && isScrolling === latestIsScrolling) return;

      latestProgress = progress;
      latestIsScrolling = isScrolling;
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        header?.style.setProperty("--customer-scroll-progress", latestProgress.toFixed(4));
        if (header?.classList.contains("is-customer-scrolling") !== latestIsScrolling) {
          header?.classList.toggle("is-customer-scrolling", latestIsScrolling);
        }
      });
    };

    syncScrollVisuals(lenis);
    const unsubscribe = lenis.on("scroll", syncScrollVisuals);

    return () => {
      unsubscribe();
      if (frame) window.cancelAnimationFrame(frame);
      if (mutationFrame) window.cancelAnimationFrame(mutationFrame);
      routeObserver?.disconnect();
      revealObserver?.disconnect();
      window.removeEventListener("customer-scroll-to-top", resetCustomerScroll);
      window.removeEventListener("customer-scroll-to-target", scrollToCustomerTarget);
      lenis.destroy();
      delete customerRoot.dataset.customerPerformance;
      header?.style.removeProperty("--customer-scroll-progress");
      header?.classList.remove("is-customer-scrolling");
    };
  }, []);

  return null;
}
