import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

const surface = `vk::raii::SurfaceKHR surface = nullptr;

void initVulkan()
{
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
}

void createSurface() {
    VkSurfaceKHR       _surface;
    if (glfwCreateWindowSurface(*instance, window, nullptr, &_surface) != 0) {
        throw std::runtime_error("failed to create window surface!");
    }
    surface = vk::raii::SurfaceKHR(instance, _surface);
}
`

const logicalcheck = `for (uint32_t qfpIndex = 0; qfpIndex < queueFamilyProperties.size(); qfpIndex++)
{
    if ((queueFamilyProperties[qfpIndex].queueFlags & vk::QueueFlagBits::eGraphics) &&
        physicalDevice.getSurfaceSupportKHR(qfpIndex, *surface))
    {
        // found a queue family that supports both graphics and present
        queueIndex = qfpIndex;
        break;
    }
}`

export default function Presentation() {
    return <div>
        <p>
            Now that we have have our device and queue handles, we can use the graphics card! We now move on to setting up resources to present results.

            We start with the surface. Since Vulkan is platform-agnbostic and not designed to interface with the window system by itself, we need to use extensions to connect Vulkan and the window system.
            We do this using the <CodeFunc>VkSurfaceKHR</CodeFunc> object, which represents a surface to present rendered images to. Therefore we first create this surface, which occurs right after setting up our debug messenger.

            <Code>{surface}</Code>

            However, not ever device in the system supports our integration with the window system. We need to further ensure that our logical device can present images to the surface, which is a queue-specific feature by updating our create logical device to check:
            <Code>{logicalcheck}</Code>
        </p>
    </div>
}