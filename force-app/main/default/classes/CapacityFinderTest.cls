@isTest
private class CapacityFinderTest {
    
    @testSetup
    static void setupTestData() {
        TestDataFactory.createDataForCapacities();
    }
    
    @isTest
    static void testGetCapacitiesSuccess() {
        Test.startTest();
        
        CapacityFinder.Inputs request = new CapacityFinder.Inputs();
        request.contractType = '110';
        request.workType = new List<String>{'12345','54321','32844','328488'};
        request.region = 'Montréal';
        request.weekEnd = Date.today();
        
        List<CapacityFinder.OutputResults> results = CapacityFinder.GetCapacities(new List<CapacityFinder.Inputs>{request});
        
        Test.stopTest();

        // System.assertEquals(1, results.size(), 'Should return one result');
        System.assertEquals('Livraison AB', results[0].WorkType.Name, 'Should return the correct work type');
     }
    
    @isTest
    static void testGetCapacitiesNoAvailability() {
        Test.startTest();
        
        CapacityFinder.Inputs request = new CapacityFinder.Inputs();
        request.contractType = '110';
        request.workType = new List<String>{'12345','54321','32844','328488'};
        request.region = 'Québec';
        request.weekEnd = Date.today().addYears(1);  // Future date with no capacity
        
        List<CapacityFinder.OutputResults> results = CapacityFinder.GetCapacities(new List<CapacityFinder.Inputs>{request});

        Test.stopTest();
        
        // System.assertEquals(1, results.size(), 'Should return one result');
        System.assertEquals(false, results[0].result, 'Should not find available capacity');
    }
    
    @isTest
    static void testGetCapacitiesSwimSpaExactMatch() {
        Test.startTest();
        
        CapacityFinder.Inputs request = new CapacityFinder.Inputs();
        request.contractType = '110';
        request.workType = new List<String>{'999'};
        request.region = 'Montréal';
        request.weekEnd = Date.today();
        request.isSwimSpa = true;
        request.spaSize = 16;  // This should match the exact size in custom setting
        
        List<CapacityFinder.OutputResults> results = CapacityFinder.GetCapacities(new List<CapacityFinder.Inputs>{request});
        
        Test.stopTest();
        
        // System.assertEquals(1, results.size(), 'Should return one result');
       // System.assertNotEquals(null, results[0].WorkType, 'Should return a work type');
    }
    
    @isTest
    static void testGetCapacitiesSwimSpaRangeMatch() {
        Test.startTest();
        
        CapacityFinder.Inputs request = new CapacityFinder.Inputs();
        request.contractType = '110';
        request.workType = new List<String>{'777'};
        request.region = 'Montréal';
        request.weekEnd = Date.today();
        request.isSwimSpa = true;
        request.spaSize = 15;  // This should match the range 13-19 in custom setting
        
        List<CapacityFinder.OutputResults> results = CapacityFinder.GetCapacities(new List<CapacityFinder.Inputs>{request});
        
        Test.stopTest();
        
        // System.assertEquals(1, results.size(), 'Should return one result');
        // System.assertNotEquals(null, results[0].WorkType, 'Should return a work type');
    }

    @isTest
    static void testSharedCapacity() {
        Test.startTest();
        
        // Use values that match your existing metadata record
        CapacityFinder.Inputs request = new CapacityFinder.Inputs();
        request.contractType = 'AB';  // This matches "Shared with Contract Type" in your metadata
        request.workType = new List<String>{'12345','54321','32844','328488'};
        request.region = 'Montreal';  // This will map to Montreal
        request.weekEnd = Date.today();
        
        List<CapacityFinder.OutputResults> results = CapacityFinder.GetCapacities(new List<CapacityFinder.Inputs>{request});
        
        Test.stopTest();
        
       // System.assertEquals(1, results.size(), 'Should return one result');
    }
    
    @isTest
    static void testGetRegionMapping() {
        // Test region mapping method
        System.assertEquals('Montreal', CapacityFinder.getRegion('montréal'), 'Should map to Montreal');
        System.assertEquals('Gatineau/Ontario', CapacityFinder.getRegion('ontario'), 'Should map to Gatineau/Ontario');
        System.assertEquals('Quebec', CapacityFinder.getRegion('québec'), 'Should map to Quebec');
        System.assertEquals('Quebec', CapacityFinder.getRegion('nouveau-brunswick'), 'Should map to Quebec');
     }
}