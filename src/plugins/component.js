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
    const { windowId, canvasAnnotationPage } = this.props;
    this.state = {
      windowId: windowId,
      canvasAnnotationPage: canvasAnnotationPage,
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
    const { canvasAnnotationPage } = this.state;
    fetch(canvasAnnotationPage, {
      method: 'get',
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(annotationData => {
        this.setState({ annotationData, loading: false });
      })
      .catch(error => {
        console.error('There was a problem receiving the annotation:', error);
        this.setState({ loading: false, error: error.message });
    });
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
        <MenuList autoFocusItem variant="selectedMenu">
          <ScrollTo
            containerRef={containerRef}
            key={`${{ annotationData }.id}-scroll`}
            offsetTop={96} // offset for the height of the form above
            scrollTo={selectedAnnotationId === { annotationData }.id}
          >
            <MenuItem
              button
              component={listContainerComponent}
              className={clsx(
                classes.annotationListItem,
                {
                  [classes.hovered]: hoveredAnnotationIds.includes({ annotationData }.id),
                },
              )}
              key={{ annotationData }.id}
              annotationid={{ annotationData }.id}
              selected={selectedAnnotationId === { annotationData }.id}
              onClick={e => this.handleClick(e, { annotationData })}
              onFocus={() => this.handleAnnotationHover({ annotationData })}
              onBlur={this.handleAnnotationBlur}
              onMouseEnter={() => this.handleAnnotationHover({ annotationData })}
              onMouseLeave={this.handleAnnotationBlur}
            >
              <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
              {annotationData && (
                  <SanitizedHtml
                  ruleSet={htmlSanitizationRuleSet}
                  htmlString={annotationData.resources[0].resource.chars}
                />
              )}
              </ListItemText>
            </MenuItem>
          </ScrollTo>
        </MenuList>
        </>
    );
  }
}

AnnotationsAuthSidePanel.propTypes = {
  canvasAnnotationPage: PropTypes.string,
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
  canvasAnnotationPage: null,
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