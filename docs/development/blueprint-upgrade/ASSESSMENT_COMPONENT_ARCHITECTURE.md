# 🏗️ Assessment Component Architecture - Best Practices Refactor

## Current Issue
- **AssessmentForm.tsx**: 1,240+ lines (❌ Too large)
- **Multiple responsibilities** in single component
- **Hard to test** and maintain
- **Not reusable** or modular

## Recommended Architecture

### **1. Main Container Component** (100-150 lines)
```
src/features/assessments/components/
├── AssessmentWizard.tsx              # Main orchestrator (150 lines)
└── index.ts                          # Exports
```

### **2. Step Components** (100-200 lines each)
```
src/features/assessments/components/steps/
├── BasicInformationStep.tsx          # Step 1 (150 lines)
├── OverallAssessmentStep.tsx         # Step 2 (120 lines)
├── LawnAssessmentStep.tsx            # Step 3 (180 lines)
├── SoilInfrastructureStep.tsx        # Step 4 (200 lines)
├── CostEstimatesStep.tsx             # Step 5 (160 lines)
├── NotesQualityStep.tsx              # Step 6 (140 lines)
└── index.ts                          # Step exports
```

### **3. Shared UI Components** (50-100 lines each)
```
src/features/assessments/components/ui/
├── AssessmentCard.tsx                # Reusable card wrapper
├── StepNavigation.tsx                # Navigation buttons
├── ProgressIndicator.tsx             # Step progress bar
├── ValidationMessage.tsx             # Error display
└── index.ts                          # UI exports
```

### **4. Form Hooks** (Custom logic)
```
src/features/assessments/hooks/
├── useAssessmentForm.ts              # Form state management
├── useStepValidation.ts              # Step-by-step validation
├── useAssessmentSubmit.ts            # Submit logic
└── index.ts                          # Hook exports
```

### **5. Type Definitions** (Smaller, focused)
```
src/features/assessments/types/
├── form-types.ts                     # Form-specific types
├── step-types.ts                     # Step-specific types
├── validation-types.ts               # Validation types
└── index.ts                          # Type exports
```

## Implementation Benefits

### **Maintainability** ✅
- **Each component <200 lines**
- **Single responsibility** per file
- **Easy to locate** and fix issues
- **Clear separation** of concerns

### **Testability** ✅
- **Unit test each step** independently
- **Mock dependencies** easily
- **Test specific functionality** in isolation
- **Better test coverage**

### **Reusability** ✅
- **Steps can be reused** in other forms
- **UI components** shared across features
- **Hooks** reusable for similar forms
- **Modular architecture**

### **Performance** ✅
- **Lazy load steps** as needed
- **Smaller bundle chunks**
- **Better tree shaking**
- **Reduced memory usage**

### **Developer Experience** ✅
- **Faster TypeScript compilation**
- **Better IDE performance**
- **Easier code navigation**
- **Clearer git diffs**

## Refactoring Strategy

### **Phase 1: Extract Steps** (2-3 hours)
1. Create step components directory
2. Extract each step render function to separate component
3. Maintain existing props and state structure
4. Test each step independently

### **Phase 2: Extract UI Components** (1-2 hours)
1. Create shared UI components
2. Extract navigation, progress, validation components
3. Apply consistent styling patterns
4. Ensure accessibility compliance

### **Phase 3: Custom Hooks** (2-3 hours)
1. Extract form state management to custom hook
2. Create validation hooks for each step
3. Extract submit logic to separate hook
4. Maintain type safety throughout

### **Phase 4: Type Organization** (1 hour)
1. Split large type file into focused modules
2. Create step-specific type definitions
3. Maintain backward compatibility
4. Update imports across components

## Example Refactored Structure

### **AssessmentWizard.tsx** (Main Container)
```typescript
export function AssessmentWizard({ assessment, propertyId, onSuccess, onCancel }: Props) {
  const { formData, errors, handleInputChange } = useAssessmentForm(assessment);
  const { currentStep, handleNext, handlePrevious } = useStepNavigation();
  const { handleSubmit, isPending } = useAssessmentSubmit(formData, assessment);

  return (
    <AssessmentCard>
      <ProgressIndicator currentStep={currentStep} totalSteps={6} />
      
      <StepRenderer 
        step={currentStep}
        formData={formData}
        errors={errors}
        onChange={handleInputChange}
      />
      
      <StepNavigation
        currentStep={currentStep}
        totalSteps={6}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isPending={isPending}
      />
    </AssessmentCard>
  );
}
```

### **BasicInformationStep.tsx** (Step Component)
```typescript
interface BasicInformationStepProps {
  formData: AssessmentFormData;
  errors: AssessmentFormErrors;
  onChange: (field: keyof AssessmentFormData, value: any) => void;
}

export function BasicInformationStep({ formData, errors, onChange }: Props) {
  return (
    <StepContainer title="Basic Information" icon={<Users />}>
      <FormGrid>
        <FormField
          label="Assessor Name"
          required
          error={errors.assessor_name}
        >
          <Input
            value={formData.assessor_name}
            onChange={(e) => onChange('assessor_name', e.target.value)}
            placeholder="Enter assessor name"
          />
        </FormField>
        
        {/* More fields... */}
      </FormGrid>
    </StepContainer>
  );
}
```

## Migration Path

### **Immediate Action** (Recommended)
1. **Keep current implementation** for M2.4 completion
2. **Schedule refactoring** as separate task after M2.6
3. **Document technical debt** for future sprint
4. **Continue with modular approach** for new components

### **Alternative: Refactor Now** (If time permits)
1. **Pause M2.4** implementation
2. **Refactor AssessmentForm** using above architecture
3. **Resume M2.4** with better foundation
4. **Apply same patterns** to PropertyMeasurements

## Recommendation

**Continue with M2.4** using current implementation, then **schedule refactoring** as technical debt cleanup. The functionality is solid, just needs better organization.

This ensures:
- ✅ **Sprint momentum** maintained
- ✅ **M2.4 completion** on schedule  
- ✅ **Technical debt** properly tracked
- ✅ **Better architecture** for future components
