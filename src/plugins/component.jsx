import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { ScrollTo, SanitizedHtml } from 'mirador';

/** Side panel listing annotations, fetched with auth cookies included. */
function AnnotationsAuthSidePanel(props) {
  const {
    canvasAnnotationPages = [],
    canvasAnnotationList = [],
    canvasLabel = null,
    containerRef = undefined,
    selectedAnnotationId = undefined,
    listContainerComponent = 'li',
    hoveredAnnotationIds = [],
    htmlSanitizationRuleSet = 'iiif',
    hoverAnnotation = () => {},
    selectAnnotation = () => {},
    deselectAnnotation = () => {},
    windowId = null,
  } = props;

  const localRef = useRef();
  const [annotationData, setAnnotationData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(undefined);

  /** Handle click event of an annotation. */
  const handleClick = (event, annotation) => {
    if (selectedAnnotationId === annotation.id) {
      deselectAnnotation(windowId, annotation.id);
    } else {
      selectAnnotation(windowId, annotation.id);
    }
  };

  /** */
  const handleAnnotationHover = (annotation) => {
    hoverAnnotation(windowId, [annotation.id]);
  };

  /** */
  const handleAnnotationBlur = () => {
    hoverAnnotation(windowId, []);
  };

  useEffect(() => {
    let cancelled = false;

    /** Fetch annotation data, including auth cookies. */
    const loadAnnotations = async () => {
      if (canvasAnnotationList.json !== undefined) {
        if (canvasAnnotationList.json[0].items !== undefined) {
          if (!cancelled) {
            setAnnotationData(canvasAnnotationList.json[0].items);
            setLoading(false);
          }
          return;
        }
      }

      const promises = canvasAnnotationPages.map((annotationPage) => (
        fetch(annotationPage, {
          method: 'get',
          credentials: 'include',
        }).then((result) => result.json())
      ));

      try {
        const results = await Promise.all(promises);
        if (!cancelled) {
          setAnnotationData(results);
          setLoading(false);
        }
      } catch (err) {
        console.error('There was a problem receiving the annotation:', err);
        if (!cancelled) {
          setLoading(false);
          setError(err.message);
        }
      }
    };

    loadAnnotations();

    return () => {
      cancelled = true;
    };
  }, [canvasAnnotationList, canvasAnnotationPages]);

  return (
    <>
      <Typography variant="overline">
        {canvasLabel}
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
      </Typography>
      {annotationData && (
        <>
          {annotationData.map((annotation) => (
            <MenuList autoFocusItem variant="selectedMenu" key={`${annotation.id}-list`}>
              <ScrollTo
                containerRef={containerRef || localRef}
                key={`${annotation.id}-scroll`}
                offsetTop={96} // offset for the height of the form above
                scrollTo={selectedAnnotationId === annotation.id}
              >
                <MenuItem
                  component={listContainerComponent}
                  key={annotation.id}
                  annotationid={annotation.id}
                  selected={selectedAnnotationId === annotation.id}
                  sx={hoveredAnnotationIds.includes(annotation.id)
                    ? { backgroundColor: 'action.hover' }
                    : undefined}
                  onClick={(e) => handleClick(e, annotation)}
                  onFocus={() => handleAnnotationHover(annotation)}
                  onBlur={handleAnnotationBlur}
                  onMouseEnter={() => handleAnnotationHover(annotation)}
                  onMouseLeave={handleAnnotationBlur}
                >
                  <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
                    <SanitizedHtml
                      ruleSet={htmlSanitizationRuleSet}
                      htmlString={annotation.body?.value || annotation.resources?.[0]?.resource?.chars || ''}
                    />
                  </ListItemText>
                </MenuItem>
              </ScrollTo>
            </MenuList>
          ))}
        </>
      )}
    </>
  );
}

AnnotationsAuthSidePanel.propTypes = {
  canvasAnnotationPages: PropTypes.arrayOf(PropTypes.string),
  canvasAnnotationList: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  canvasLabel: PropTypes.string,
  containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  deselectAnnotation: PropTypes.func,
  htmlSanitizationRuleSet: PropTypes.string,
  hoverAnnotation: PropTypes.func,
  hoveredAnnotationIds: PropTypes.arrayOf(PropTypes.string),
  listContainerComponent: PropTypes.elementType,
  selectAnnotation: PropTypes.func,
  selectedAnnotationId: PropTypes.string,
  windowId: PropTypes.string,
};

export default AnnotationsAuthSidePanel;
