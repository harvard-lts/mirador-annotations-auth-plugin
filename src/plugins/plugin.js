import { compose } from 'redux';
import { connect } from 'react-redux';
import AnnotationsAuthSidePanel from './component';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import { getVisibleCanvasIds, getCanvases, getCanvasLabel } from 'mirador/dist/es/src/state/selectors';

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
function getAnnotationPage(canvases, canvasIds) {
  let annotationPage = null;
  for (let i = 0; i < canvases.length; i++) {
    if (canvases[i].id === canvasIds[0]) {
      if (canvases[i].__jsonld.otherContent !== undefined) {
        // Version 2 Annotation Page
        annotationPage = canvases[i].__jsonld.otherContent[0]["@id"];
      }
      if (canvases[i].__jsonld.annotations !== undefined) {
        // Version 3 Annotation Page
        annotationPage = canvases[i].__jsonld.annotations[0].id;
      }
      break;
    }
  }
  console.log('annotationPage', annotationPage);
  return annotationPage;
}

const mapStateToProps = (state, { canvasId, windowId }) => ({
  canvasAnnotationPage: getAnnotationPage(getCanvases(state, { windowId }), getVisibleCanvasIds(state, { windowId })),
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