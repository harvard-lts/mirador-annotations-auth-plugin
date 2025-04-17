import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Typography from '@material-ui/core/Typography';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import { ScrollTo } from 'mirador/dist/es/src/components/ScrollTo';
import SanitizedHtml from 'mirador/dist/es/src/containers/SanitizedHtml';

export default class AnnotationsAuthSidePanel extends Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
    this.handleAnnotationHover = this.handleAnnotationHover.bind(this);
    this.handleAnnotationBlur = this.handleAnnotationBlur.bind(this);
    const { windowId, canvasAnnotationPages } = this.props;
    this.state = {
      windowId: windowId,
      canvasAnnotationPages: canvasAnnotationPages,
    };
  }

  /**
   * Handle click event of an annotation.
  */
  handleClick(event, annotation) {
    const {
      deselectAnnotation, selectAnnotation, selectedAnnotationId, windowId,
    } = this.props;

    if (selectedAnnotationId === annotation.id) {
      deselectAnnotation(windowId, annotation.id);
    } else {
      selectAnnotation(windowId, annotation.id);
    }
  }

  /** */
  handleAnnotationHover(annotation) {
    const { hoverAnnotation, windowId } = this.props;

    hoverAnnotation(windowId, [annotation.id]);
  }

  /** */
  handleAnnotationBlur() {
    const { hoverAnnotation, windowId } = this.props;

    hoverAnnotation(windowId, []);
  }

  async componentDidMount() {
    const { canvasAnnotationPages } = this.state;
    const promises = [];
    canvasAnnotationPages.forEach(function (annotationPage, index) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const result = await 
            fetch(
              annotationPage, 
              {
                method: 'get', 
                credentials: 'include',
              }
            );
          resolve(result.json());
        } catch (error) {
          reject('Network response was not ok');
        }
      });
      promises.push(promise);
    });

    try {
      const results = await Promise.all(promises);
      this.setState({
        annotationData: results,
        loading: false,
      });
    } catch (error) {
      console.error('There was a problem receiving the annotation:', error);
      this.setState({ loading: false, error: error.message });
    }
 }

  render() {
    const { classes, 
      containerRef,
      canvasLabel,
      selectedAnnotationId,
      listContainerComponent,
      hoveredAnnotationIds,
      htmlSanitizationRuleSet,
     } = this.props;
    const { annotationData, loading, error } = this.state;

    if ({ annotationData }.length === 0) return <></>;
    return (
        <>
          <Typography className={classes.sectionHeading} variant="overline">
            { canvasLabel }
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
          </Typography>
          {annotationData && (
            <>
            {
            annotationData.map((annotation, i) =>
              <MenuList autoFocusItem variant="selectedMenu">
                <ScrollTo
                  containerRef={containerRef}
                  key={`${{ annotation }.id}-scroll`}
                  offsetTop={96} // offset for the height of the form above
                  scrollTo={selectedAnnotationId === { annotation }.id}
                >
                  <MenuItem
                    button
                    component={listContainerComponent}
                    className={clsx(
                      classes.annotationListItem,
                      {
                        [classes.hovered]: hoveredAnnotationIds.includes({ annotation }.id),
                      },
                    )}
                    key={{ annotation }.id}
                    annotationid={{ annotation }.id}
                    selected={selectedAnnotationId === { annotation }.id}
                    onClick={e => this.handleClick(e, { annotation })}
                    onFocus={() => this.handleAnnotationHover({ annotation })}
                    onBlur={this.handleAnnotationBlur}
                    onMouseEnter={() => this.handleAnnotationHover({ annotation })}
                    onMouseLeave={this.handleAnnotationBlur}
                  >
                    <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
                      <SanitizedHtml
                        ruleSet={htmlSanitizationRuleSet}
                        htmlString={annotation.resources[0].resource.chars}
                      />
                    </ListItemText>
                  </MenuItem>
                </ScrollTo>
              </MenuList>
            )}
            </>
          )}
        </>
    );
  }
}

AnnotationsAuthSidePanel.propTypes = {
  canvasAnnotationPages: PropTypes.arrayOf(PropTypes.string),
  canvasLabel: PropTypes.string,
  classes: PropTypes.objectOf(PropTypes.string),
  htmlSanitizationRuleSet: PropTypes.string,
  hoverAnnotation: PropTypes.func.isRequired,
  hoveredAnnotationIds: PropTypes.arrayOf(PropTypes.string),
  listContainerComponent: PropTypes.elementType,
  selectAnnotation: PropTypes.func.isRequired,
  selectedAnnotationId: PropTypes.string,
  windowId: PropTypes.string.isRequired,
};

AnnotationsAuthSidePanel.defaultProps = {
  canvasAnnotationPages: [],
  canvasLabel: null,
  classes: {},
  htmlSanitizationRuleSet: 'iiif',
  hoverAnnotation: () => {},
  hoveredAnnotationIds: [],
  listContainerComponent: 'li',
  selectAnnotation: () => {},
  selectedAnnotationId: undefined,
  windowId: null,
};