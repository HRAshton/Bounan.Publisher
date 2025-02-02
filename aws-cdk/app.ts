import { App as AwsApp } from 'aws-cdk-lib';
import { PublisherStack } from './publisher-stack';

class App extends AwsApp {
    constructor() {
        super();

        new PublisherStack(this, 'Bounan-Publisher', {});
    }
}

new App().synth();
