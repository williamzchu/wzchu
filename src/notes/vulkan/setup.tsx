import Code from "../../Code"
import CodeFunc from "../../CodeFunc"

export default function Setup(){
    const opengl = `public:
    void run() {
        initWindow();
        initVulkan();
        mainLoop();
        cleanup();
    }

private:
    GLFWwindow* window;

    void initWindow() {
        glfwInit();

        // Since GLFW's original design is for OpenGL contexts, we tell it not to create OpenGL context
        glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);
        glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);

        window = glfwCreateWindow(WIDTH, HEIGHT, "Vulkan", nullptr, nullptr);
    }
    `
const loop = `while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
}`

const cleanup = `void cleanup() {
    glfwDestroyWindow(window);

    glfwTerminate();
}`
    const instance = `vk::raii::Context  context;
vk::raii::Instance instance = nullptr;

void createInstance()
{
	constexpr vk::ApplicationInfo appInfo{.pApplicationName   = "Hello Triangle",
	                                      .applicationVersion = VK_MAKE_VERSION(1, 0, 0),
	                                      .pEngineName        = "No Engine",
	                                      .engineVersion      = VK_MAKE_VERSION(1, 0, 0),
	                                      .apiVersion         = vk::ApiVersion14};

	// Get the required instance extensions from GLFW.
	uint32_t glfwExtensionCount = 0;
	auto     glfwExtensions     = glfwGetRequiredInstanceExtensions(&glfwExtensionCount);

	// Check if the required GLFW extensions are supported by the Vulkan implementation.
	auto extensionProperties = context.enumerateInstanceExtensionProperties();
	for (uint32_t i = 0; i < glfwExtensionCount; ++i)
	{
		if (std::ranges::none_of(extensionProperties,
		                         [glfwExtension = glfwExtensions[i]](auto const &extensionProperty) { return strcmp(extensionProperty.extensionName, glfwExtension) == 0; }))
		{
			throw std::runtime_error("Required GLFW extension not supported: " + std::string(glfwExtensions[i]));
		}
	}

	vk::InstanceCreateInfo createInfo{
	    .pApplicationInfo        = &appInfo,
	    .enabledExtensionCount   = glfwExtensionCount,
	    .ppEnabledExtensionNames = glfwExtensions};
	instance = vk::raii::Instance(context, createInfo);
}`
const validation = `vk::InstanceCreateInfo createInfo{
    .pApplicationInfo        = &appInfo,
    .enabledLayerCount       = static_cast<uint32_t>(requiredLayers.size()),
    .ppEnabledLayerNames     = requiredLayers.data(),
    .enabledExtensionCount   = 0,
    .ppEnabledExtensionNames = nullptr };`


const physical = `std::vector<const char*> deviceExtensions = {
    vk::KHRSwapchainExtensionName,
    vk::KHRSpirv14ExtensionName,
    vk::KHRSynchronization2ExtensionName,
    vk::KHRCreateRenderpass2ExtensionName
};

vk::raii::PhysicalDevice physicalDevice = nullptr;

void initVulkan() {
    createInstance();
    setupDebugMessenger();
    pickPhysicalDevice();
}

void pickPhysicalDevice() {
    std::vector<vk::raii::PhysicalDevice> devices = instance.enumeratePhysicalDevices();
    const auto                            devIter = std::ranges::find_if(
        devices,
        [&](auto const &device) {
            // Check if the device supports the Vulkan 1.3 API version
            bool supportsVulkan1_3 = device.getProperties().apiVersion >= VK_API_VERSION_1_3;

            // Check if any of the queue families support graphics operations
            auto queueFamilies = device.getQueueFamilyProperties();
            bool supportsGraphics =
                std::ranges::any_of(queueFamilies, [](auto const &qfp) { return !!(qfp.queueFlags & vk::QueueFlagBits::eGraphics); });

            // Check if all required device extensions are available
            auto availableDeviceExtensions = device.enumerateDeviceExtensionProperties();
            bool supportsAllRequiredExtensions =
                std::ranges::all_of(requiredDeviceExtension,
                                                                [&availableDeviceExtensions](auto const &requiredDeviceExtension) {
                                        return std::ranges::any_of(availableDeviceExtensions,
                                                                                                [requiredDeviceExtension](auto const &availableDeviceExtension) { return strcmp(availableDeviceExtension.extensionName, requiredDeviceExtension) == 0; });
                                    });

            auto features                 = device.template getFeatures2<vk::PhysicalDeviceFeatures2, vk::PhysicalDeviceVulkan13Features, vk::PhysicalDeviceExtendedDynamicStateFeaturesEXT>();
            bool supportsRequiredFeatures = features.template get<vk::PhysicalDeviceVulkan13Features>().dynamicRendering &&
                                            features.template get<vk::PhysicalDeviceExtendedDynamicStateFeaturesEXT>().extendedDynamicState;

            return supportsVulkan1_3 && supportsGraphics && supportsAllRequiredExtensions && supportsRequiredFeatures;
        });
    if (devIter != devices.end())
    {
        physicalDevice = *devIter;
    }
    else
    {
        throw std::runtime_error("failed to find a suitable GPU!");
    }
}`

const logical = `vk::raii::Device         device = nullptr;

vk::raii::Queue graphicsQueue = nullptr;

void initVulkan() {
    createInstance();
    setupDebugMessenger();
    pickPhysicalDevice();
    createLogicalDevice();
}

void createLogicalDevice() {
    // find the index of the first queue family that supports graphics
    std::vector<vk::QueueFamilyProperties> queueFamilyProperties = physicalDevice.getQueueFamilyProperties();

    // get the first index into queueFamilyProperties which supports graphics
    auto graphicsQueueFamilyProperty = std::ranges::find_if(queueFamilyProperties, [](auto const& qfp) { return (qfp.queueFlags & vk::QueueFlagBits::eGraphics) != static_cast<vk::QueueFlags>(0); });
    assert(graphicsQueueFamilyProperty != queueFamilyProperties.end() && "No graphics queue family found!");

    auto graphicsIndex = static_cast<uint32_t>(std::distance(queueFamilyProperties.begin(), graphicsQueueFamilyProperty));

    // query for Vulkan 1.3 features
    vk::StructureChain<vk::PhysicalDeviceFeatures2, vk::PhysicalDeviceVulkan13Features, vk::PhysicalDeviceExtendedDynamicStateFeaturesEXT> featureChain = {
        {},                                   // vk::PhysicalDeviceFeatures2
        {.dynamicRendering = true},           // vk::PhysicalDeviceVulkan13Features
        {.extendedDynamicState = true}        // vk::PhysicalDeviceExtendedDynamicStateFeaturesEXT
    };

    // create a Device
    float                     queuePriority = 0.0f;
    vk::DeviceQueueCreateInfo deviceQueueCreateInfo{ .queueFamilyIndex = graphicsIndex, .queueCount = 1, .pQueuePriorities = &queuePriority };
    vk::DeviceCreateInfo      deviceCreateInfo{ .pNext = &featureChain.get<vk::PhysicalDeviceFeatures2>(),
                                            .queueCreateInfoCount = 1,
                                            .pQueueCreateInfos = &deviceQueueCreateInfo,
                                            .enabledExtensionCount = static_cast<uint32_t>(requiredDeviceExtension.size()),
                                            .ppEnabledExtensionNames = requiredDeviceExtension.data() };

    device = vk::raii::Device(physicalDevice, deviceCreateInfo);
    graphicsQueue = vk::raii::Queue(device, graphicsIndex, 0);
}
`
    return <div>

        <p>
            Since we are doing on screen rendering, we use GLFW. However, GLFW was originally built for OpenGL, so initialization requires something like this:
        </p>
        <Code>{opengl}</Code>

        We then update the main loop to continuously poll events and also where we will later render the frames.

        <Code>{loop}</Code>

        And finally since we created something without RAII, we have to clean it up.
        <Code>{cleanup}</Code>

        Now this is actully the only bit of code in the cleanup! Past vulkan implementations would actually have a lot more without the RAII header, as we will see from the amount of private Vulkan variables in our boilerplate.

        Now the first thing is to create an instance, which will become our first vulkan private member variables as well as defining how to create the instance, and adding <CodeFunc>createInstance</CodeFunc> to our <CodeFunc>initVulkan</CodeFunc>.

            <Code>{instance}</Code>

        <p>Next, we add validation layers for error checking which simply modifies <CodeFunc>createInfo</CodeFunc> with</p> 
        <Code>{validation}</Code>

        Now that we have Vulkan initialized, we need to select a graphics card for Vulkan. We first need a physical device. However, we need devices that are suitable, and support operations and extension we want.
        <Code>{physical}</Code>

        Since almost every operation in Vulkan is done by submitting commands to a queue, we need a queue family from our device that allows the commands we desire. 
        We do this first by selecting a logical device. We have previously selected a physical device, but we need a logical device to interface with it while also describing features we need. 
        We also need to specify which queues to create, and which device features we are using.

        <Code>{logical}</Code>

    </div>
}