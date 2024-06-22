import { App as AwsApp } from 'aws-cdk-lib';
import { Stack } from './stack';

class App extends AwsApp {
    constructor() {
        super();

        new Stack(this, 'Bounan-Publisher', {});
    }
}

new App().synth();
