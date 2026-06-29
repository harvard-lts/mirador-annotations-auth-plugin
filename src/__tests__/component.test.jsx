import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock `mirador` so we don't load the full bundle (jsdom canvas error) and so
// ScrollTo / SanitizedHtml render as simple passthroughs in the test.
vi.mock('mirador', () => ({
  ScrollTo: ({ children }) => children,
  SanitizedHtml: ({ htmlString }) => <span>{htmlString}</span>,
}));

const { default: AnnotationsAuthSidePanel } = await import('../plugins/component.jsx');

describe('AnnotationsAuthSidePanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the canvas label', async () => {
    render(<AnnotationsAuthSidePanel canvasLabel="My Canvas" canvasAnnotationList={{}} />);
    expect(await screen.findByText('My Canvas')).toBeInTheDocument();
  });

  it('renders annotations from an inline annotation list (no fetch)', async () => {
    const canvasAnnotationList = {
      json: [{ items: [{ id: 'a1', body: { value: 'Hello annotation' } }] }],
    };

    render(
      <AnnotationsAuthSidePanel
        canvasLabel="Canvas"
        canvasAnnotationList={canvasAnnotationList}
        hoveredAnnotationIds={['a1']}
      />,
    );

    expect(await screen.findByText('Hello annotation')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches annotation pages with credentials included', async () => {
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({ id: 'a2', body: { value: 'Fetched annotation' } }),
    });

    render(
      <AnnotationsAuthSidePanel
        canvasLabel="Canvas"
        canvasAnnotationList={[]}
        canvasAnnotationPages={['https://example.test/page']}
      />,
    );

    expect(await screen.findByText('Fetched annotation')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.test/page',
      expect.objectContaining({ method: 'get', credentials: 'include' }),
    );
  });

  it('renders an error message when the fetch rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValue(new Error('boom'));

    render(
      <AnnotationsAuthSidePanel
        canvasLabel="Canvas"
        canvasAnnotationList={[]}
        canvasAnnotationPages={['https://example.test/page']}
      />,
    );

    await waitFor(() => expect(screen.getByText(/Error: boom/)).toBeInTheDocument());
  });
});
