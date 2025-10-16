import { compose } from 'redux';
import { connect } from 'react-redux';
import AnnotationsAuthSidePanel from './component';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import { getVisibleCanvasIds, getCanvases, getCanvasLabel } from 'mirador/dist/es/src/state/selectors';
import AnnotationFactory from 'mirador/dist/es/src/lib/AnnotationFactory';

const styles = theme => ({
  section: {
    borderBottom: `.5px solid ${theme.palette.section_divider}`,
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(2),
  },
  citationIntro: {
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(2),
  },
});

/** */
function getAnnotationPages(canvases, canvasIds) {
  let annotationPage = null;
  let annotationPagesArray = [];
  let annotationPages = [];
  for (let i = 0; i < canvases.length; i++) {
    if (canvases[i].id === canvasIds[0]) {
      if (canvases[i].__jsonld.otherContent !== undefined) {
        // Version 2 Annotation Page
        annotationPage = canvases[i].__jsonld.otherContent[0]["@id"];
        annotationPagesArray = canvases[i].__jsonld.otherContent;
        for (let j = 0; j < annotationPagesArray.length; j++) {
          if (annotationPagesArray[j]["@type"] === "sc:AnnotationList") {
            annotationPages[j] = annotationPagesArray[j]["@id"];
          }
        }
      }
      if (canvases[i].__jsonld.annotations !== undefined) {
        // Version 3 Annotation Page
        annotationPage = canvases[i].__jsonld.annotations[0].id;
        annotationPagesArray = canvases[i].__jsonld.annotations;
        for (let j = 0; j < annotationPagesArray.length; j++) {
          if (annotationPagesArray[j].type === "AnnotationPage") {
            annotationPages[j] = annotationPagesArray[j].id;
          }
        }
      }
      break;
    }
  }
  return annotationPages;
}

function getAnnotationList(canvases, canvasIds) {
  let annotationList = [];
  for (let i = 0; i < canvases.length; i++) {
    if (canvases[i].id === canvasIds[0]) {
      if (canvases[i].__jsonld.otherContent !== undefined) {
        // Version 2 Annotation Page
        annotationList = AnnotationFactory.determineAnnotation(canvases[i].__jsonld.otherContent);
      }
      if (canvases[i].__jsonld.annotations !== undefined) {
        // Version 3 Annotation Page
        annotationList = AnnotationFactory.determineAnnotation(canvases[i].__jsonld.annotations);
      }
      break;
    }
  }
  return annotationList;
}

const mapStateToProps = (state, { canvasId, windowId }) => ({
  canvasAnnotationPages: getAnnotationPages(getCanvases(state, { windowId }), getVisibleCanvasIds(state, { windowId })),
  canvasAnnotationList: getAnnotationList(getCanvases(state, { windowId }), getVisibleCanvasIds(state, { windowId })),
  canvasLabel: getCanvasLabel(state, { canvasId, windowId }),
  windowId: windowId,
});

const enhance = compose(
  withTranslation(),
  withStyles(styles),
  connect(mapStateToProps),
);

export default {
    target: 'CanvasAnnotations',
    mode: 'wrap',
    component: enhance(AnnotationsAuthSidePanel)
};