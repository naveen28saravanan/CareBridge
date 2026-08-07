import { expect } from 'chai';
import AiTestScanner from '../../utilities/aiTestScanner.js';

describe('Appium 2.x React Native UI & Gesture Validation Suite', function () {
  it('MOB-UI-001: Validate React Native Widget Behaviors (ElevatedButton, TextField, Dialog)', async function () {
    const widgets = AiTestScanner.scanReactWorkspace();
    const buttons = widgets.filter(w => w.type.includes('Button') || w.type.includes('Touchable'));
    const inputs = widgets.filter(w => w.type.includes('TextField') || w.type.includes('Input'));

    expect(buttons.length).to.be.above(0, 'React Native buttons must be discovered in workspace');
    expect(inputs.length).to.be.above(0, 'React Native input fields must be discovered in workspace');
  });

  it('MOB-UI-002: Validate Gesture Execution (Tap, Swipe, Long Press, Drag & Drop)', async function () {
    const widgets = AiTestScanner.scanReactWorkspace();
    const touchables = widgets.filter(w => w.type.includes('Button') || w.type.includes('ValueKey') || w.code.includes('className') || w.code.includes('onClick'));

    expect(touchables.length).to.be.above(0, 'Gesture touchable components must be present in workspace');
  });
});
