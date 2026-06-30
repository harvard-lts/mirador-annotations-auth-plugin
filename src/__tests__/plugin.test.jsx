import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

// Mock `mirador` so importing the plugin doesn't load the full bundle (which
// triggers a jsdom canvas error) and so we can drive selector return values.
const getCanvases = vi.fn();
const getVisibleCanvasIds = vi.fn();
const getCanvasLabel = vi.fn();
const determineAnnotation = vi.fn();

vi.mock('mirador', () => ({
  getCanvases: (...args) => getCanvases(...args),
  getVisibleCanvasIds: (...args) => getVisibleCanvasIds(...args),
  getCanvasLabel: (...args) => getCanvasLabel(...args),
  AnnotationFactory: { determineAnnotation: (...args) => determineAnnotation(...args) },
  ScrollTo: ({ children }) => children,
  SanitizedHtml: ({ htmlString }) => htmlString,
}));

// Import AFTER vi.mock so the mock is in effect.
const pluginModule = await import('../plugins/plugin.js');
const {
  default: plugin, getAnnotationPages, getAnnotationList, mapStateToProps,
} = pluginModule;

describe('plugin descriptor', () => {
  it('exposes the expected Mirador 4 descriptor shape', () => {
    expect(plugin.target).toBe('CanvasAnnotations');
    expect(plugin.mode).toBe('wrap');
    expect(plugin.name).toBe('AnnotationsAuthPlugin');
    expect(plugin.component).toBeTruthy();
    expect(plugin.mapStateToProps).toBe(mapStateToProps);
  });
});

describe('getAnnotationPages', () => {
  it('returns an empty array when the matching canvas has no annotations', () => {
    const canvases = [{ id: 'c1', __jsonld: {} }];
    expect(getAnnotationPages(canvases, ['c1'])).toEqual([]);
  });

  it('extracts v2 otherContent AnnotationList ids', () => {
    const canvases = [{
      id: 'c1',
      __jsonld: {
        otherContent: [
          { '@id': 'page-1', '@type': 'sc:AnnotationList' },
          { '@id': 'ignored', '@type': 'sc:Other' },
        ],
      },
    }];
    expect(getAnnotationPages(canvases, ['c1'])).toEqual(['page-1']);
  });

  it('extracts v3 AnnotationPage ids', () => {
    const canvases = [{
      id: 'c1',
      __jsonld: {
        annotations: [
          { id: 'page-3', type: 'AnnotationPage' },
        ],
      },
    }];
    expect(getAnnotationPages(canvases, ['c1'])).toEqual(['page-3']);
  });

  it('returns empty when no canvas id matches', () => {
    const canvases = [{ id: 'c1', __jsonld: {} }];
    expect(getAnnotationPages(canvases, ['nope'])).toEqual([]);
  });
});

describe('getAnnotationList', () => {
  beforeEach(() => determineAnnotation.mockReset());

  it('delegates v2 otherContent to AnnotationFactory', () => {
    determineAnnotation.mockReturnValue(['v2']);
    const canvases = [{ id: 'c1', __jsonld: { otherContent: ['x'] } }];
    expect(getAnnotationList(canvases, ['c1'])).toEqual(['v2']);
    expect(determineAnnotation).toHaveBeenCalledWith(['x']);
  });

  it('delegates v3 annotations to AnnotationFactory', () => {
    determineAnnotation.mockReturnValue(['v3']);
    const canvases = [{ id: 'c1', __jsonld: { annotations: ['y'] } }];
    expect(getAnnotationList(canvases, ['c1'])).toEqual(['v3']);
    expect(determineAnnotation).toHaveBeenCalledWith(['y']);
  });

  it('returns an empty array when nothing matches', () => {
    const canvases = [{ id: 'c1', __jsonld: {} }];
    expect(getAnnotationList(canvases, ['c1'])).toEqual([]);
  });
});

describe('mapStateToProps', () => {
  beforeEach(() => {
    getCanvases.mockReset();
    getVisibleCanvasIds.mockReset();
    getCanvasLabel.mockReset();
    determineAnnotation.mockReset();
  });

  it('maps selector output into props', () => {
    getCanvases.mockReturnValue([{ id: 'c1', __jsonld: {} }]);
    getVisibleCanvasIds.mockReturnValue(['c1']);
    getCanvasLabel.mockReturnValue('Page 1');

    const props = mapStateToProps({}, { canvasId: 'c1', windowId: 'w1' });

    expect(props.canvasAnnotationPages).toEqual([]);
    expect(props.canvasAnnotationList).toEqual([]);
    expect(props.canvasLabel).toBe('Page 1');
    expect(props.windowId).toBe('w1');
  });
});
