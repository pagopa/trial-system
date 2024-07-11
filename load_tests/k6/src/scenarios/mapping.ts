import { FeatureScenarioType } from "../utils/config";
import { trialManagerActivation, trialManagerGetSub } from "./trial_manager";

export const getFeatureScenario = (scenarioType: FeatureScenarioType) => {
    switch (scenarioType){
        case "TRIAL_MANAGER_ACTIVATION":
            return trialManagerActivation
        case "TRIAL_MANAGER_GET_SUB":
            return trialManagerGetSub
        
    }
}