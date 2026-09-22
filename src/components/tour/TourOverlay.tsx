import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTourStore } from '../../store/useTourStore';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PAD = 8;
const CARD_MARGIN = 12;
const CARD_WIDTH = 340;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
`;

const Spotlight = styled.div`
  position: fixed;
  z-index: 2001;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px solid ${({ theme }) => theme.colors.brand};
  box-shadow: 0 0 0 9999px rgba(16, 24, 40, 0.55);
  pointer-events: none;
  transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
`;

const Card = styled.div`
  position: fixed;
  z-index: 2002;
  width: ${CARD_WIDTH}px;
  max-width: calc(100vw - ${CARD_MARGIN * 2}px);
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.raised};
  font-family: ${({ theme }) => theme.font.base};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StepLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Title = styled.h4`
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Body = styled.p`
  margin: 0 0 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

interface TourOverlayProps {
  /** Top negative review's id — resolves the '/analysis' step's route. */
  analysisReviewId: string | null;
}

export function TourOverlay({ analysisReviewId }: TourOverlayProps) {
  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const steps = useTourStore((s) => s.steps);
  const next = useTourStore((s) => s.next);
  const prev = useTourStore((s) => s.prev);
  const stop = useTourStore((s) => s.stop);

  const location = useLocation();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);

  const step = active ? steps[stepIndex] : undefined;
  const targetRoute = step
    ? step.route === '/analysis'
      ? analysisReviewId
        ? `/analysis/${analysisReviewId}`
        : '/dashboard'
      : step.route
    : null;

  // Drive navigation: each step names the page it lives on, so advancing across the closed
  // loop is just "does the URL already match?"
  useEffect(() => {
    if (!active || !targetRoute) return;
    if (location.pathname !== targetRoute) navigate(targetRoute);
  }, [active, targetRoute, location.pathname, navigate]);

  // Find + track the step's anchor. Polls briefly because navigating to a new route needs a
  // render cycle before the anchor exists; keeps polling for ~1s after found to ride out the
  // scrollIntoView animation, then goes quiet until scroll/resize asks for a recheck.
  useEffect(() => {
    setRect(null);
    if (!active || !step || location.pathname !== targetRoute) return;

    let intervalId: number;
    let foundAt: number | null = null;
    const startedAt = Date.now();

    const measure = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const find = () => document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    const recheck = () => {
      const el = find();
      if (el) measure(el);
    };

    intervalId = window.setInterval(() => {
      const el = find();
      if (el) {
        if (foundAt === null) {
          foundAt = Date.now();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        measure(el);
        if (Date.now() - foundAt > 900) window.clearInterval(intervalId);
      } else if (Date.now() - startedAt > 4000) {
        window.clearInterval(intervalId);
      }
    }, 120);

    window.addEventListener('scroll', recheck, true);
    window.addEventListener('resize', recheck);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('scroll', recheck, true);
      window.removeEventListener('resize', recheck);
    };
  }, [active, step, targetRoute, location.pathname]);

  // Two-pass placement: the card's own size is only known once it has rendered, so position
  // it after that render rather than guessing a height up front.
  useLayoutEffect(() => {
    const cardEl = cardRef.current;
    if (!active || !cardEl) return;
    const cw = cardEl.offsetWidth;
    const ch = cardEl.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect) {
      setCardPos({ top: (vh - ch) / 2, left: (vw - cw) / 2 });
      return;
    }
    let top = rect.top + rect.height + CARD_MARGIN;
    if (top + ch > vh - CARD_MARGIN) {
      top = rect.top - ch - CARD_MARGIN;
      if (top < CARD_MARGIN) top = Math.max(CARD_MARGIN, (vh - ch) / 2);
    }
    const left = Math.min(Math.max(rect.left, CARD_MARGIN), vw - cw - CARD_MARGIN);
    setCardPos({ top, left });
  }, [active, rect]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, stop]);

  if (!active || !step) return null;

  return createPortal(
    <>
      <Backdrop />
      {rect ? (
        <Spotlight
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
          }}
        />
      ) : null}
      <Card ref={cardRef} style={cardPos ? { top: cardPos.top, left: cardPos.left } : { top: -9999, left: -9999 }}>
        <CardHeader>
          <StepLabel>Step {stepIndex + 1} of {steps.length}</StepLabel>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={stop} aria-label="Close tour" />
        </CardHeader>
        <Title>{step.title}</Title>
        <Body>{step.body}</Body>
        <Footer>
          <Button type="text" size="small" onClick={stop}>Skip tour</Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepIndex > 0 ? <Button size="small" onClick={prev}>Back</Button> : null}
            <Button type="primary" size="small" onClick={next}>
              {stepIndex >= steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </Footer>
      </Card>
    </>,
    document.body,
  );
}
